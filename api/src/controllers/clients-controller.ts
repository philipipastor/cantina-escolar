import type { Request, Response } from "express"
import { prisma } from "../prisma"
import {
  childParamsSchema,
  createChildSchema,
  createClientSchema,
  listClientsSchema,
  statementQuerySchema,
  updateChildSchema,
  updateClientSchema,
} from "../schemas/clients-schema"
import { idParamsSchema, toLikeTerm } from "../schemas/shared-schema"
import { AppError } from "../utils/AppError"
import { describeBalance } from "../utils/balance"
import { formatDate } from "../utils/dates"
import { getAccountBalance } from "../utils/entries"
import { entryInclude, presentClient, presentEntry } from "../utils/presenters"

async function findClient(canteenId: string, id: string) {
  const client = await prisma.client.findFirst({
    where: { id, canteenId },
    include: { children: { orderBy: { name: "asc" } } },
  })
  if (!client) throw new AppError("Cliente não encontrado", 404)
  return client
}

export class ClientsController {
  // Busca a conta pelo nome do responsável, telefone ou filho, sem diferenciar acentos, e filtra por saldo.
  async index(request: Request, response: Response) {
    const { canteenId } = request.params
    const { search, active, status, page, perPage } = listClientsSchema.parse(request.query)
    const term = toLikeTerm(search)
    // Telefone é comparado só pelos dígitos: "(11) 9999" e "119999" encontram o mesmo cliente.
    const digits = search?.replace(/\D/g, "")
    const phoneTerm = digits ? toLikeTerm(digits) : null

    const rows = await prisma.$queryRaw<
      { id: string; balance: bigint; lastPurchaseDate: Date | null; total: bigint }[]
    >`
      SELECT "id", "balance", "lastPurchaseDate", COUNT(*) OVER()::bigint AS "total"
      FROM (
        SELECT c."id",
               lower(unaccent(c."name")) AS "sortName",
               COALESCE((SELECT SUM(e."amountCents") FROM "Entry" e WHERE e."clientId" = c."id"), 0)::bigint AS "balance",
               (SELECT MAX(e."referenceDate") FROM "Entry" e
                WHERE e."clientId" = c."id" AND e."type" = 'PURCHASE'
                  AND NOT EXISTS (SELECT 1 FROM "Entry" r WHERE r."reversesId" = e."id")) AS "lastPurchaseDate"
        FROM "Client" c
        WHERE c."canteenId" = ${canteenId}
          AND c."isActive" = ${active}
          AND (
            unaccent(c."name") ILIKE unaccent(${term}::text)
            OR (${phoneTerm}::text IS NOT NULL
                AND regexp_replace(COALESCE(c."phone", ''), '[^0-9]', '', 'g') LIKE ${phoneTerm}::text)
            OR EXISTS (
              SELECT 1 FROM "Child" ch
              WHERE ch."clientId" = c."id" AND ch."isActive" AND unaccent(ch."name") ILIKE unaccent(${term}::text)
            )
          )
      ) accounts
      WHERE ${status ?? null}::text IS NULL
         OR (${status ?? null}::text = 'DEBT' AND "balance" < 0)
         OR (${status ?? null}::text = 'CREDIT' AND "balance" > 0)
      ORDER BY "sortName", "id"
      LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`

    const clients = await prisma.client.findMany({
      where: { id: { in: rows.map((row) => row.id) } },
      include: { children: { where: { isActive: true }, orderBy: { name: "asc" } } },
    })
    const clientsById = new Map(clients.map((client) => [client.id, client]))

    return response.json({
      clients: rows.map((row) => ({
        ...presentClient(clientsById.get(row.id)!, Number(row.balance)),
        lastPurchaseDate: row.lastPurchaseDate ? formatDate(row.lastPurchaseDate) : null,
      })),
      total: Number(rows[0]?.total ?? 0),
      page,
      perPage,
    })
  }

  async create(request: Request, response: Response) {
    const { canteenId } = request.params
    const { children, name, phone, notes } = createClientSchema.parse(request.body)

    const client = await prisma.client.create({
      data: {
        canteenId,
        name,
        phone,
        notes,
        children: {
          create: children.map((child) => ({ name: child.name, canteen: { connect: { id: canteenId } } })),
        },
      },
      include: { children: { orderBy: { name: "asc" } } },
    })
    return response.status(201).json({ client: presentClient(client, 0) })
  }

  async show(request: Request, response: Response) {
    const { id } = idParamsSchema.parse(request.params)
    const client = await findClient(request.params.canteenId, id)
    return response.json({ client: presentClient(client, await getAccountBalance(prisma, id)) })
  }

  async update(request: Request, response: Response) {
    const { id } = idParamsSchema.parse(request.params)
    const data = updateClientSchema.parse(request.body)

    await findClient(request.params.canteenId, id)
    const client = await prisma.client.update({
      where: { id },
      data,
      include: { children: { orderBy: { name: "asc" } } },
    })
    return response.json({ client: presentClient(client, await getAccountBalance(prisma, id)) })
  }

  async createChild(request: Request, response: Response) {
    const { canteenId } = request.params
    const { id: clientId } = idParamsSchema.parse(request.params)
    const { name } = createChildSchema.parse(request.body)

    await findClient(canteenId, clientId)
    const child = await prisma.child.create({ data: { canteenId, clientId, name } })
    return response.status(201).json({ child })
  }

  async updateChild(request: Request, response: Response) {
    const { id: clientId, childId } = childParamsSchema.parse(request.params)
    const data = updateChildSchema.parse(request.body)

    await findClient(request.params.canteenId, clientId)
    if (!(await prisma.child.findFirst({ where: { id: childId, clientId } }))) {
      throw new AppError("Filho não encontrado", 404)
    }

    const child = await prisma.child.update({ where: { id: childId }, data })
    return response.json({ child })
  }

  // Extrato em ordem cronológica, com o saldo acumulado após cada lançamento e os totais do período.
  async statement(request: Request, response: Response) {
    const { canteenId } = request.params
    const { id: clientId } = idParamsSchema.parse(request.params)
    const { page, perPage, from, to } = statementQuerySchema.parse(request.query)

    await findClient(canteenId, clientId)
    const entries = await prisma.entry.findMany({
      where: { canteenId, clientId },
      include: entryInclude,
      orderBy: [{ referenceDate: "asc" }, { recordedAt: "asc" }, { id: "asc" }],
    })

    // O saldo acumulado considera todo o histórico; só depois o extrato é recortado pelo período.
    // Junto, o saldo no início do período (tudo antes de `from`) e no fim dele (tudo até `to`, o dia inteiro),
    // usados pelo extrato em PDF. Só leitura: nada é gravado.
    let balanceCents = 0
    let openingBalanceCents = 0
    let closingBalanceCents = 0
    const statement = entries
      .map((entry) => {
        balanceCents += entry.amountCents
        const presented = presentEntry(entry)
        if (from && presented.referenceDate < from) openingBalanceCents = balanceCents
        if (!to || presented.referenceDate <= to) closingBalanceCents = balanceCents
        return { ...presented, balanceAfterCents: balanceCents }
      })
      .filter((entry) => (!from || entry.referenceDate >= from) && (!to || entry.referenceDate <= to))

    // Compras e pagamentos estornados não entram nos totais, igual aos painéis.
    const period = { purchasedCents: 0, paidCents: 0, openingBalanceCents, closingBalanceCents }
    for (const entry of statement) {
      if (entry.isReversed) continue
      if (entry.type === "PURCHASE") period.purchasedCents += -entry.amountCents
      if (entry.type === "PAYMENT") period.paidCents += entry.amountCents
    }

    // As páginas contam a partir do lançamento mais recente, mantendo a ordem cronológica em cada uma.
    const end = Math.max(statement.length - (page - 1) * perPage, 0)
    const start = Math.max(end - perPage, 0)

    return response.json({
      balance: describeBalance(balanceCents),
      period,
      entries: statement.slice(start, end),
      total: statement.length,
      page,
      perPage,
    })
  }
}
