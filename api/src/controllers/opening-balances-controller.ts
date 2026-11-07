import type { Request, Response } from "express"
import { createOpeningBalanceSchema } from "../schemas/entries-schema"
import { getBalanceChange } from "../utils/balance"
import { toDatabaseDate } from "../utils/dates"
import { findEntryToRedo, runEntryOperation } from "../utils/entries"

export class OpeningBalancesController {
  // Dívida ou crédito que o cliente já tinha antes de usar o sistema.
  async create(request: Request, response: Response) {
    const { canteenId } = request.params
    const { idempotencyKey, ...data } = createOpeningBalanceSchema.parse(request.body)

    const result = await runEntryOperation(
      canteenId,
      data.clientId,
      idempotencyKey,
      data,
      async ({ tx, balanceCents, requestHash }) => {
        if (data.redoneFromId) await findEntryToRedo(tx, canteenId, data.redoneFromId, "OPENING_BALANCE")

        const amountCents = data.nature === "DEBT" ? -data.amountCents : data.amountCents
        const entry = await tx.entry.create({
          data: {
            canteenId,
            clientId: data.clientId,
            userId: request.user!.id,
            type: "OPENING_BALANCE",
            amountCents,
            referenceDate: toDatabaseDate(data.referenceDate),
            description: data.description,
            redoneFromId: data.redoneFromId ?? null,
            idempotencyKey,
            requestHash,
          },
        })
        return { entryId: entry.id, effect: getBalanceChange(balanceCents, amountCents) }
      },
    )

    return response.status(result.repeated ? 200 : 201).json(result)
  }
}
