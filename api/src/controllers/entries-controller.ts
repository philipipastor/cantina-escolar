import type { Request, Response } from "express"
import { prisma } from "../prisma"
import { listEntriesSchema, reverseEntrySchema } from "../schemas/entries-schema"
import { idParamsSchema } from "../schemas/shared-schema"
import { AppError } from "../utils/AppError"
import { getBalanceChange } from "../utils/balance"
import { today, toDatabaseDate } from "../utils/dates"
import { runEntryOperation } from "../utils/entries"
import { entryInclude, presentEntry } from "../utils/presenters"

export class EntriesController {
  async index(request: Request, response: Response) {
    const { page, perPage, type, clientId, from, to } = listEntriesSchema.parse(request.query)

    const where = {
      canteenId: request.params.canteenId,
      type,
      clientId,
      referenceDate:
        from || to
          ? { gte: from ? toDatabaseDate(from) : undefined, lte: to ? toDatabaseDate(to) : undefined }
          : undefined,
    }
    const [entries, total] = await prisma.$transaction([
      prisma.entry.findMany({
        where,
        include: entryInclude,
        orderBy: [{ referenceDate: "desc" }, { recordedAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.entry.count({ where }),
    ])

    return response.json({ entries: entries.map(presentEntry), total, page, perPage })
  }

  async show(request: Request, response: Response) {
    const { id } = idParamsSchema.parse(request.params)
    const entry = await prisma.entry.findFirst({
      where: { id, canteenId: request.params.canteenId },
      include: entryInclude,
    })
    if (!entry) throw new AppError("Lançamento não encontrado", 404)
    return response.json({ entry: presentEntry(entry) })
  }

  // Reverte o efeito financeiro com um lançamento inverso; o original permanece no extrato.
  async reverse(request: Request, response: Response) {
    const { canteenId } = request.params
    const { id } = idParamsSchema.parse(request.params)
    const { reason, idempotencyKey } = reverseEntrySchema.parse(request.body)

    const target = await prisma.entry.findFirst({ where: { id, canteenId }, select: { clientId: true } })
    if (!target) throw new AppError("Lançamento não encontrado", 404)

    const result = await runEntryOperation(
      canteenId,
      target.clientId,
      idempotencyKey,
      { id, reason },
      async ({ tx, balanceCents, requestHash }) => {
        const original = await tx.entry.findUniqueOrThrow({
          where: { id },
          include: { reversedBy: { select: { id: true } } },
        })
        if (original.type === "REVERSAL") {
          throw new AppError(
            "Um estorno não pode ser estornado. Faça um novo lançamento.",
            400,
            "REVERSAL_OF_REVERSAL",
          )
        }
        if (original.reversedBy) {
          throw new AppError("Este lançamento já foi estornado", 409, "ALREADY_REVERSED")
        }

        const reversal = await tx.entry.create({
          data: {
            canteenId,
            clientId: original.clientId,
            userId: request.user!.id,
            type: "REVERSAL",
            amountCents: -original.amountCents,
            referenceDate: toDatabaseDate(today()),
            reason,
            reversesId: original.id,
            idempotencyKey,
            requestHash,
          },
        })
        return { entryId: reversal.id, effect: getBalanceChange(balanceCents, -original.amountCents) }
      },
    )

    return response.status(result.repeated ? 200 : 201).json(result)
  }
}
