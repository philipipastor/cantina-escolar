import type { Balance, PaymentMethod } from "../clients/types"
import type { Entry } from "../sales/types"

export type MoneyEntryInput = {
  clientId: string
  amountCents: number
  paymentMethod: PaymentMethod
  referenceDate: string
  // Lançamento estornado que este novo corrige; a API liga os dois no histórico.
  redoneFromId?: string
}

export type MoneyEntryResult = {
  entry: Entry
  // Vem nulo quando a API reconhece uma nova tentativa da mesma operação.
  effect: { balanceBefore: Balance } | null
  balance: Balance
  repeated: boolean
}

// O que a tela de confirmação recebe da tela de recebimento.
export type PaymentConfirmation = {
  clientName: string
  amountCents: number
  paymentMethod: PaymentMethod
  referenceDate: string
  balanceBeforeCents: number
  balance: Balance
  // Para o comprovante no WhatsApp.
  phone: string | null
}
