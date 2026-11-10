import type { PaymentMethod } from "../clients/types"
import type { Entry } from "../sales/types"

// Tudo o que foi lançado num dia. Os totais desconsideram lançamentos estornados.
export type DailyReview = {
  date: string
  totals: {
    purchasesCents: number
    purchasesCount: number
    paymentsCents: number
    paymentsByMethod: Record<PaymentMethod, number>
    creditRefundsCents: number
    creditRefundsByMethod: Record<PaymentMethod, number>
    openingBalances: number
    reversedEntries: number
    reversalsMade: number
  }
  entries: Entry[]
}
