export type Balance = {
  balanceCents: number
  status: "DEBT" | "CREDIT" | "ZERO"
  availableCreditCents: number
  amountOwedCents: number
}

export type Child = {
  id: string
  name: string
  isActive: boolean
}

export type Client = {
  id: string
  name: string
  phone: string | null
  notes: string | null
  isActive: boolean
  children: Child[]
  balance: Balance
}

export type ClientListItem = Client & { lastPurchaseDate: string | null }

export type ClientStatusFilter = "ALL" | "DEBT" | "CREDIT" | "INACTIVE"

export type ClientInput = {
  name: string
  phone?: string | null
  notes?: string | null
}

export type EntryType = "PURCHASE" | "PAYMENT" | "OPENING_BALANCE" | "CREDIT_REFUND" | "REVERSAL"
export type PaymentMethod = "CASH" | "PIX" | "CARD"

export type StatementEntry = {
  id: string
  type: EntryType
  amountCents: number
  referenceDate: string
  recordedAt: string
  paymentMethod: PaymentMethod | null
  consumer: { type: "CHILD" | "ACCOUNT_HOLDER" | "UNIDENTIFIED"; child: { name: string } | null } | null
  description: string | null
  reason: string | null
  items: { id: string; description: string; quantity: number; subtotalCents: number }[]
  isReversed: boolean
  // Num estorno, o lançamento que ele cancela.
  reverses: { type: EntryType; referenceDate: string } | null
  balanceAfterCents: number
}

export type Statement = {
  balance: Balance
  period: {
    purchasedCents: number
    paidCents: number
    // Saldo antes do primeiro dia e ao fim do último dia do período (negativo = dívida).
    openingBalanceCents: number
    closingBalanceCents: number
  }
  entries: StatementEntry[]
  total: number
}
