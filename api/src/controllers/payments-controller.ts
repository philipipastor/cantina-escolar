import type { Request, Response } from "express"
import { createPaymentSchema } from "../schemas/entries-schema"
import { getPaymentEffect } from "../utils/balance"
import { toDatabaseDate } from "../utils/dates"
import { findEntryToRedo, runEntryOperation } from "../utils/entries"

export class PaymentsController {
  // Pagamento de dívida e depósito antecipado são o mesmo lançamento.
  async create(request: Request, response: Response) {
    const { canteenId } = request.params
    const { idempotencyKey, ...data } = createPaymentSchema.parse(request.body)

    const result = await runEntryOperation(
      canteenId,
      data.clientId,
      idempotencyKey,
      data,
      async ({ tx, balanceCents, requestHash }) => {
        if (data.redoneFromId) await findEntryToRedo(tx, canteenId, data.redoneFromId, "PAYMENT")

        const entry = await tx.entry.create({
          data: {
            canteenId,
            clientId: data.clientId,
            userId: request.user!.id,
            type: "PAYMENT",
            amountCents: data.amountCents,
            referenceDate: toDatabaseDate(data.referenceDate),
            paymentMethod: data.paymentMethod,
            description: data.description ?? null,
            redoneFromId: data.redoneFromId ?? null,
            idempotencyKey,
            requestHash,
          },
        })
        return { entryId: entry.id, effect: getPaymentEffect(balanceCents, data.amountCents) }
      },
    )

    return response.status(result.repeated ? 200 : 201).json(result)
  }
}
