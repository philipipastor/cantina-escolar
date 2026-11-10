import type { PaymentMethod } from "../clients/types"

// Resumo da cantina no período. Lançamentos estornados não entram nos totais.
export type CanteenSummary = {
  receivableCents: number
  debtorAccounts: number
  availableCreditCents: number
  creditAccounts: number
  purchasesCents: number
  purchasesCount: number
  paymentsCents: number
  paymentsByMethod: Record<PaymentMethod, number>
  creditRefundsCents: number
  reversalsCount: number
}
