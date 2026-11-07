import type { Request, Response } from "express"
import type { PaymentMethod } from "@prisma/client"
import { prisma } from "../prisma"
import { dailyReviewQuerySchema, periodQuerySchema } from "../schemas/dashboard-schema"
import { today, toDatabaseDate } from "../utils/dates"
import { entryInclude, presentEntry } from "../utils/presenters"

const emptyMethods = (): Record<PaymentMethod, number> => ({ CASH: 0, PIX: 0, CARD: 0 })

function emptySummary() {
  return {
    // Dívidas e créditos são somados separadamente, sem compensar uma conta com outra.
    receivableCents: 0,
    debtorAccounts: 0,
    availableCreditCents: 0,
    creditAccounts: 0,
    purchasesCents: 0,
    purchasesCount: 0,
    paymentsCents: 0,
    paymentsByMethod: emptyMethods(),
    creditRefundsCents: 0,
    reversalsCount: 0,
  }
}

type Summary = ReturnType<typeof emptySummary>

function getPeriod(query: unknown) {
  const { from, to } = periodQuerySchema.parse(query)
  return { from: from ?? to ?? today(), to: to ?? from ?? today() }
}

/**
 * Resumo por cantina. As posições (a receber, créditos) valem para o momento atual; os demais
 * números valem para o período e desconsideram lançamentos estornados.
 */
async function summarizeCanteens(from: string, to: string, canteenId?: string) {
  const [positions, flows, reversals, canteens] = await Promise.all([
    prisma.$queryRaw<
      { canteenId: string; receivable: bigint; debtors: bigint; credit: bigint; withCredit: bigint }[]
    >`
      SELECT "canteenId",
             COALESCE(SUM(-balance) FILTER (WHERE balance < 0), 0)::bigint AS "receivable",
             COUNT(*) FILTER (WHERE balance < 0)::bigint AS "debtors",
             COALESCE(SUM(balance) FILTER (WHERE balance > 0), 0)::bigint AS "credit",
             COUNT(*) FILTER (WHERE balance > 0)::bigint AS "withCredit"
      FROM (
        SELECT "canteenId", "clientId", SUM("amountCents") AS balance
        FROM "Entry"
        GROUP BY "canteenId", "clientId"
      ) accounts
      GROUP BY "canteenId"`,
    prisma.$queryRaw<
      { canteenId: string; type: string; method: PaymentMethod | null; total: bigint; count: bigint }[]
    >`
      SELECT e."canteenId", e."type"::text AS "type", e."paymentMethod"::text AS "method",
             SUM(e."amountCents")::bigint AS "total", COUNT(*)::bigint AS "count"
      FROM "Entry" e
      WHERE e."referenceDate" BETWEEN ${from}::date AND ${to}::date
        AND e."type" IN ('PURCHASE', 'PAYMENT', 'CREDIT_REFUND')
        AND NOT EXISTS (SELECT 1 FROM "Entry" r WHERE r."reversesId" = e."id")
      GROUP BY e."canteenId", e."type", e."paymentMethod"`,
    prisma.entry.groupBy({
      by: ["canteenId"],
      where: { type: "REVERSAL", referenceDate: { gte: toDatabaseDate(from), lte: toDatabaseDate(to) } },
      _count: { _all: true },
    }),
    prisma.canteen.findMany({ where: { id: canteenId }, select: { id: true } }),
  ])

  const summaries = new Map(canteens.map((canteen) => [canteen.id, emptySummary()]))

  for (const position of positions) {
    const summary = summaries.get(position.canteenId)
    if (!summary) continue
    summary.receivableCents = Number(position.receivable)
    summary.debtorAccounts = Number(position.debtors)
    summary.availableCreditCents = Number(position.credit)
    summary.creditAccounts = Number(position.withCredit)
  }

  for (const flow of flows) {
    const summary = summaries.get(flow.canteenId)
    if (!summary) continue
    const total = Number(flow.total)
    if (flow.type === "PURCHASE") {
      summary.purchasesCents += -total
      summary.purchasesCount += Number(flow.count)
    } else if (flow.type === "PAYMENT") {
      summary.paymentsCents += total
      if (flow.method) summary.paymentsByMethod[flow.method] += total
    } else {
      summary.creditRefundsCents += -total
    }
  }

  for (const reversal of reversals) {
    const summary = summaries.get(reversal.canteenId)
    if (summary) summary.reversalsCount = reversal._count._all
  }

  return summaries
}

function sumSummaries(summaries: Summary[]) {
  const totals = emptySummary()
  for (const summary of summaries) {
    totals.receivableCents += summary.receivableCents
    totals.debtorAccounts += summary.debtorAccounts
    totals.availableCreditCents += summary.availableCreditCents
    totals.creditAccounts += summary.creditAccounts
    totals.purchasesCents += summary.purchasesCents
    totals.purchasesCount += summary.purchasesCount
    totals.paymentsCents += summary.paymentsCents
    totals.paymentsByMethod.CASH += summary.paymentsByMethod.CASH
    totals.paymentsByMethod.PIX += summary.paymentsByMethod.PIX
    totals.paymentsByMethod.CARD += summary.paymentsByMethod.CARD
    totals.creditRefundsCents += summary.creditRefundsCents
    totals.reversalsCount += summary.reversalsCount
  }
  return totals
}

export class DashboardController {
  // Visão do administrador sobre as três cantinas, com os estornos recentes em destaque.
  async overview(request: Request, response: Response) {
    const { from, to } = getPeriod(request.query)
    const [summaries, canteens, recentReversals] = await Promise.all([
      summarizeCanteens(from, to),
      prisma.canteen.findMany({ orderBy: { name: "asc" } }),
      prisma.entry.findMany({
        where: { type: "REVERSAL" },
        include: { ...entryInclude, canteen: { select: { id: true, name: true } } },
        orderBy: { recordedAt: "desc" },
        take: 20,
      }),
    ])

    return response.json({
      period: { from, to },
      totals: sumSummaries([...summaries.values()]),
      canteens: canteens.map((canteen) => ({ ...canteen, summary: summaries.get(canteen.id) })),
      recentReversals: recentReversals.map((entry) => ({ ...presentEntry(entry), canteen: entry.canteen })),
    })
  }

  async canteen(request: Request, response: Response) {
    const { canteenId } = request.params
    const { from, to } = getPeriod(request.query)
    const summaries = await summarizeCanteens(from, to, canteenId)
    return response.json({ period: { from, to }, summary: summaries.get(canteenId) })
  }

  // Tudo o que foi lançado para um dia, para comparar com o papel e o caixa.
  async dailyReview(request: Request, response: Response) {
    const { date = today() } = dailyReviewQuerySchema.parse(request.query)
    const entries = await prisma.entry.findMany({
      where: { canteenId: request.params.canteenId, referenceDate: toDatabaseDate(date) },
      include: entryInclude,
      orderBy: [{ recordedAt: "asc" }, { id: "asc" }],
    })

    const totals = {
      purchasesCents: 0,
      purchasesCount: 0,
      paymentsCents: 0,
      paymentsByMethod: emptyMethods(),
      creditRefundsCents: 0,
      creditRefundsByMethod: emptyMethods(),
      openingBalances: 0,
      reversedEntries: 0,
      reversalsMade: 0,
    }

    for (const entry of entries) {
      if (entry.type === "REVERSAL") {
        totals.reversalsMade += 1
      } else if (entry.reversedBy) {
        totals.reversedEntries += 1
      } else if (entry.type === "PURCHASE") {
        totals.purchasesCents += -entry.amountCents
        totals.purchasesCount += 1
      } else if (entry.type === "PAYMENT" && entry.paymentMethod) {
        totals.paymentsCents += entry.amountCents
        totals.paymentsByMethod[entry.paymentMethod] += entry.amountCents
      } else if (entry.type === "CREDIT_REFUND" && entry.paymentMethod) {
        totals.creditRefundsCents += -entry.amountCents
        totals.creditRefundsByMethod[entry.paymentMethod] += -entry.amountCents
      } else if (entry.type === "OPENING_BALANCE") {
        totals.openingBalances += 1
      }
    }

    return response.json({ date, totals, entries: entries.map(presentEntry) })
  }
}
