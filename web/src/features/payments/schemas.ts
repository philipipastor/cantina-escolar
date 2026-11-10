import { z } from "zod"
import { formatCents, isValidAmount, parseCents } from "../../lib/money"

const commonFields = {
  paymentMethod: z.enum(["PIX", "CASH", "CARD"], { error: "Informe a forma de pagamento" }),
  date: z.string().min(1, "Informe a data"),
}

export const paymentSchema = z.object({
  ...commonFields,
  clientId: z.string().min(1, "Selecione o cliente"),
  amount: z.string().refine(isValidAmount, "Informe o valor recebido"),
})

export type PaymentFormInput = z.infer<typeof paymentSchema>

// O limite depende do crédito de cada cliente. Esta conferência só adianta o aviso: quem decide é a API.
export function refundSchema(availableCreditCents: number) {
  return z.object({
    ...commonFields,
    amount: z
      .string()
      .refine(isValidAmount, "Informe o valor da devolução")
      .refine(
        (value) => (parseCents(value) ?? 0) <= availableCreditCents,
        `O crédito disponível é de ${formatCents(availableCreditCents)}`,
      ),
  })
}

export type RefundFormInput = z.infer<ReturnType<typeof refundSchema>>
