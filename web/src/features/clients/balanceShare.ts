import { formatCents } from "../../lib/money"
import type { Balance, Client } from "./types"

// Texto enviado ao responsável: só a situação e o valor do saldo atual, nada do extrato.
// Usa os valores que a API já calcula (amountOwedCents e availableCreditCents), sem refazer contas.
export function buildBalanceMessage(balance: Balance) {
  if (balance.status === "DEBT") return `Saldo devedor: ${formatCents(balance.amountOwedCents)}`
  if (balance.status === "CREDIT") return `Crédito disponível: ${formatCents(balance.availableCreditCents)}`
  return `Saldo atual: ${formatCents(0)}`
}

// O que o envio precisa: a mensagem pronta e o telefone do cliente, que o WhatsApp vai usar.
export type BalanceShare = { message: string; phone: string | null }

export function prepareBalanceShare(client: Pick<Client, "balance" | "phone">): BalanceShare {
  return { message: buildBalanceMessage(client.balance), phone: client.phone }
}

// "copied": a mensagem foi copiada; "manual": o navegador não deixou copiar e a pessoa copia da tela.
export type ShareResult = "copied" | "manual"

// Único ponto de envio da tela. Por enquanto copia a mensagem para colar em qualquer conversa.
// Na integração com o WhatsApp, só esta função muda: a tela continua chamando shareBalance.
export async function shareBalance({ message }: BalanceShare): Promise<ShareResult> {
  try {
    await navigator.clipboard.writeText(message)
    return "copied"
  } catch {
    return "manual"
  }
}
