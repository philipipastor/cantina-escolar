import type { Request, Response } from "express"
import { createCreditRefundSchema } from "../schemas/entries-schema"
import { AppError } from "../utils/AppError"
import { describeBalance, getBalanceChange } from "../utils/balance"
import { toDatabaseDate } from "../utils/dates"
import { findEntryToRedo, runEntryOperation } from "../utils/entries"

export class CreditRefundsController {
  // Devolve ao cliente parte do crédito; nunca mais do que há disponível.
  async create(request: Request, response: Response) {
    const { canteenId } = request.params
    const { idempotencyKey, ...data } = createCreditRefundSchema.parse(request.body)

    const result = await runEntryOperation(
      canteenId,
      data.clientId,
      idempotencyKey,
      data,
      async ({ tx, balanceCents, requestHash }) => {
        if (data.redoneFromId) await findEntryToRedo(tx, canteenId, data.redoneFromId, "CREDIT_REFUND")

        if (data.amountCents > balanceCents) {
          throw new AppError(
            "O valor da devolução é maior que o crédito disponível",
            400,
            "INSUFFICIENT_CREDIT",
            { balance: describeBalance(balanceCents) },
          )
        }

        const entry = await tx.entry.create({
          data: {
            canteenId,
            clientId: data.clientId,
            userId: request.user!.id,
            type: "CREDIT_REFUND",
            amountCents: -data.amountCents,
            referenceDate: toDatabaseDate(data.referenceDate),
            paymentMethod: data.paymentMethod,
            description: data.description ?? null,
            redoneFromId: data.redoneFromId ?? null,
            idempotencyKey,
            requestHash,
          },
        })
        return { entryId: entry.id, effect: getBalanceChange(balanceCents, -data.amountCents) }
      },
    )

    return response.status(result.repeated ? 200 : 201).json(result)
  }
}
