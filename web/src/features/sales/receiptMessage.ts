import { formatNumericDate, todayIso } from "../../lib/dates"
import { formatMoneyForMessage, type MessageShare } from "../../lib/whatsapp"
import type { Balance } from "../clients/types"
import type { Entry } from "./types"

// O que o comprovante usa de uma compra: os mesmos campos na confirmação da venda e nos detalhes.
type ReceiptPurchase = Pick<Entry, "amountCents" | "referenceDate" | "consumer" | "items">

// Quem consumiu: o filho, quando foi ele; nos demais casos, o próprio responsável pela conta.
function consumerName(purchase: ReceiptPurchase, clientName: string) {
  return purchase.consumer?.type === "CHILD" && purchase.consumer.child
    ? purchase.consumer.child.name
    : clientName
}

// "Hoje" para a compra do dia; para uma compra antiga aberta nos detalhes, a data dela.
function when(referenceDate: string) {
  return referenceDate === todayIso() ? "Hoje" : `Em ${formatNumericDate(referenceDate)}`
}

// Linha do saldo, com a situação no lugar do rótulo. A dívida aparece sem o sinal de menos.
function balanceLine(balance: Balance) {
  if (balance.status === "DEBT") return `Valor em aberto: ${formatMoneyForMessage(balance.amountOwedCents)}`
  if (balance.status === "CREDIT")
    return `Crédito disponível: ${formatMoneyForMessage(balance.availableCreditCents)}`
  return `Saldo atual: ${formatMoneyForMessage(0)}`
}

/**
 * Comprovante de compra para o WhatsApp. Única fonte do texto: a confirmação da venda e os detalhes da
 * compra chamam esta função. Só lê os dados; não cria nem altera lançamentos.
 * `balance` é o saldo do cliente: logo após a venda, na confirmação; o de agora, nos detalhes.
 */
export function buildPurchaseReceipt(purchase: ReceiptPurchase, clientName: string, balance: Balance) {
  const items = purchase.items.map(
    (item) => `• ${item.quantity}x ${item.description} - ${formatMoneyForMessage(item.subtotalCents)}`,
  )
  return [
    "Olá!",
    `${when(purchase.referenceDate)}, ${consumerName(purchase, clientName)} realizou uma compra na cantina com os seguintes produtos:`,
    "",
    ...items,
    `Valor total: ${formatMoneyForMessage(-purchase.amountCents)}`,
    "",
    balanceLine(balance),
    "",
    "Obrigado!",
  ].join("\n")
}

export function preparePurchaseReceipt(
  purchase: ReceiptPurchase,
  client: { name: string; phone: string | null; balance: Balance },
): MessageShare {
  return { message: buildPurchaseReceipt(purchase, client.name, client.balance), phone: client.phone }
}
