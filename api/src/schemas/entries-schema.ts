import { z } from "zod"
import {
  centsField,
  dateField,
  idempotencyKeyField,
  idField,
  optionalText,
  paginationSchema,
  referenceDateField,
  requiredText,
} from "./shared-schema"

const paymentMethodField = z.enum(["CASH", "PIX", "CARD"], { error: "Informe a forma de pagamento" })
const quantityField = z.number().int().min(1).max(1000)

const consumerField = z.discriminatedUnion("type", [
  z.object({ type: z.literal("CHILD"), childId: idField }),
  z.object({ type: z.literal("ACCOUNT_HOLDER") }),
  z.object({ type: z.literal("UNIDENTIFIED") }),
])

// Só se vende produto cadastrado: o preço sempre vem do servidor, nunca de quem envia a compra.
const itemField = z.object({ productId: idField, quantity: quantityField })

export const purchasePreviewSchema = z.object({
  clientId: idField,
  consumer: consumerField,
  items: z.array(itemField).min(1, "Selecione pelo menos um item").max(100),
  referenceDate: referenceDateField,
  redoneFromId: idField.optional(),
})

export const createPurchaseSchema = purchasePreviewSchema.extend({
  idempotencyKey: idempotencyKeyField,
  // Saldo mostrado na prévia; se mudou até a confirmação, a API avisa em vez de salvar.
  expectedBalanceCents: z.number().int().optional(),
  confirmDuplicate: z.boolean().default(false),
})

const moneyFields = {
  clientId: idField,
  amountCents: centsField,
  paymentMethod: paymentMethodField,
  referenceDate: referenceDateField,
  description: optionalText(500),
  redoneFromId: idField.optional(),
  idempotencyKey: idempotencyKeyField,
}

export const createPaymentSchema = z.object(moneyFields)
export const createCreditRefundSchema = z.object(moneyFields)

export const createOpeningBalanceSchema = z.object({
  clientId: idField,
  nature: z.enum(["DEBT", "CREDIT"], { error: "Informe se é dívida ou crédito" }),
  amountCents: centsField,
  description: requiredText("a origem do saldo", 500),
  referenceDate: referenceDateField,
  redoneFromId: idField.optional(),
  idempotencyKey: idempotencyKeyField,
})

export const reverseEntrySchema = z.object({
  reason: requiredText("a justificativa", 500),
  idempotencyKey: idempotencyKeyField,
})

export const listEntriesSchema = paginationSchema.extend({
  type: z.enum(["PURCHASE", "PAYMENT", "OPENING_BALANCE", "CREDIT_REFUND", "REVERSAL"]).optional(),
  clientId: idField.optional(),
  from: dateField.optional(),
  to: dateField.optional(),
})

export type PurchasePreviewInput = z.infer<typeof purchasePreviewSchema>
