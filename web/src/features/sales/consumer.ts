import type { Client } from "../clients/types"
import type { ConsumerType, PurchaseConsumer } from "./types"

export const ACCOUNT_HOLDER = "ACCOUNT_HOLDER"
export const UNIDENTIFIED = "UNIDENTIFIED"

// Quem consumiu, como opção da tela: o id do filho, o responsável ou "não identificado".
export type ConsumerChoice = string

export function toPurchaseConsumer(choice: ConsumerChoice): PurchaseConsumer {
  if (choice === ACCOUNT_HOLDER) return { type: "ACCOUNT_HOLDER" }
  if (choice === UNIDENTIFIED) return { type: "UNIDENTIFIED" }
  return { type: "CHILD", childId: choice }
}

const fixedLabels: Partial<Record<ConsumerType, string>> = {
  ACCOUNT_HOLDER: "Responsável",
  UNIDENTIFIED: "Não identificado",
}

export function consumerTypeLabel(type: ConsumerType) {
  return fixedLabels[type] ?? ""
}

/**
 * Opções de "Quem consumiu?". Filhos inativos não aparecem, a não ser o da venda que está sendo refeita.
 * `avatarName` é o nome usado para as iniciais do círculo.
 */
export function consumerOptions(client: Client, keepChildId?: string) {
  const children = client.children
    .filter((child) => child.isActive || child.id === keepChildId)
    .map((child) => ({ value: child.id, label: child.name, avatarName: child.name }))

  return [
    ...children,
    { value: ACCOUNT_HOLDER, label: "Responsável", avatarName: client.name },
    { value: UNIDENTIFIED, label: "Não identificado", avatarName: "Não identificado" },
  ]
}
