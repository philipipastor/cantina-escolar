import type { PaymentMethod } from "./types"

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  PIX: "Pix",
  CASH: "Dinheiro",
  CARD: "Cartão",
}
