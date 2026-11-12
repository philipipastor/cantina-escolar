import { formatMoneyForMessage, type MessageShare } from "../../lib/whatsapp"
import type { Balance, Client } from "./types"

// Texto enviado ao responsável: a saudação com o nome e o saldo atual, nada do extrato.
// Usa os valores que a API já calcula (amountOwedCents e availableCreditCents), sem refazer contas.
// O \n quebra a linha no WhatsApp.
export function buildBalanceMessage(name: string, balance: Balance) {
  const greeting = `Olá, ${name.trim()}.`
  if (balance.status === "CREDIT")
    return `${greeting}\nSeu crédito atual é de: ${formatMoneyForMessage(balance.availableCreditCents)}`
  // A dívida aparece sem o sinal de menos.
  if (balance.status === "DEBT")
    return `${greeting}\nSeu débito atual é de: ${formatMoneyForMessage(balance.amountOwedCents)}`
  // Conta em dia: R$ 0,00.
  return `${greeting}\nSeu saldo atual é de: ${formatMoneyForMessage(balance.amountOwedCents)}`
}

export function prepareBalanceShare(client: Pick<Client, "name" | "balance" | "phone">): MessageShare {
  return { message: buildBalanceMessage(client.name, client.balance), phone: client.phone }
}

// O envio em si é o mesmo do comprovante de venda (WhatsApp, menu de compartilhar ou cópia).
export { shareMessage as shareBalance, type ShareResult } from "../../lib/whatsapp"
