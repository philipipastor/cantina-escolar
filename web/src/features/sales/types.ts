import type { Balance, EntryType, PaymentMethod } from "../clients/types"

// Item no carrinho da venda. Só a tela usa o preço: a API sempre recalcula o total com os preços dela.
export type SaleItem = {
  productId: string
  name: string
  unitPriceCents: number
  quantity: number
}

export type ConsumerType = "CHILD" | "ACCOUNT_HOLDER" | "UNIDENTIFIED"

// Uma venda nova só aceita um filho ou o responsável; UNIDENTIFIED existe apenas nas vendas antigas.
export type PurchaseConsumer = { type: "CHILD"; childId: string } | { type: "ACCOUNT_HOLDER" }

export type PurchaseItemInput = { productId: string; quantity: number }

export type PurchaseInput = {
  clientId: string
  consumer: PurchaseConsumer
  items: PurchaseItemInput[]
  referenceDate: string
  redoneFromId?: string
}

export type Entry = {
  id: string
  type: EntryType
  amountCents: number
  referenceDate: string
  recordedAt: string
  client: { id: string; name: string }
  recordedBy: { id: string; name: string }
  paymentMethod: PaymentMethod | null
  consumer: { type: ConsumerType; child: { id: string; name: string } | null } | null
  reason: string | null
  items: {
    id: string
    productId: string
    description: string
    quantity: number
    unitPriceCents: number
    subtotalCents: number
  }[]
  isReversed: boolean
  reversedBy: { id: string; recordedAt: string; reason: string; user: { name: string } } | null
  redoneFromId: string | null
  redoneAsId: string | null
}

export type PurchaseResult = {
  entry: Entry
  // Vem nulo quando a API reconhece uma nova tentativa da mesma venda.
  effect: { balanceBefore: Balance } | null
  balance: Balance
  repeated: boolean
}

// O que a tela de confirmação recebe da tela de venda.
export type SaleConfirmation = {
  clientName: string
  consumerLabel: string
  totalCents: number
  referenceDate: string
  balanceBeforeCents: number
  balance: Balance
  // Para o comprovante: a compra como a API registrou e o telefone do cliente.
  entry: Entry
  phone: string | null
}
