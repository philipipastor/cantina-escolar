import { formatMoneyForMessage, type MessageShare } from "../../lib/whatsapp"
import type { Balance, PaymentMethod } from "../clients/types"
import { paymentMethodLabels } from "../clients/paymentMethod"

// Saldo como o comprovante mostra: zero ou positivo é crédito; negativo é valor em aberto, sem o sinal.
function balanceLine(balance: Balance) {
  if (balance.balanceCents > 0) return `Crédito disponível: ${formatMoneyForMessage(balance.balanceCents)}`
  if (balance.balanceCents < 0) return `Valor em aberto: ${formatMoneyForMessage(balance.amountOwedCents)}`
  return `Saldo atual: ${formatMoneyForMessage(0)}`
}

/**
 * Comprovante de recebimento para o WhatsApp. Única fonte do texto: a confirmação do recebimento e os
 * detalhes dele chamam esta função. Só lê os dados; não cria nem altera lançamentos.
 * Os *asteriscos* deixam o trecho em negrito no WhatsApp, e a linha vazia separa os blocos.
 */
export function buildPaymentReceipt(
  payment: { amountCents: number; paymentMethod: PaymentMethod },
  clientName: string,
  balance: Balance,
) {
  return [
    "Olá!",
    "",
    `Recebemos um pagamento de *${clientName.trim()}* referente às compras realizadas na cantina.`,
    "",
    `*Valor recebido: ${formatMoneyForMessage(Math.abs(payment.amountCents))}*`,
    "",
    `*Forma de pagamento:* ${paymentMethodLabels[payment.paymentMethod]}`,
    "",
    "*Saldo atualizado:*",
    balanceLine(balance),
    "",
    "Obrigado pelo pagamento!",
  ].join("\n")
}

export function preparePaymentReceipt(
  payment: { amountCents: number; paymentMethod: PaymentMethod },
  client: { name: string; phone: string | null; balance: Balance },
): MessageShare {
  return { message: buildPaymentReceipt(payment, client.name, client.balance), phone: client.phone }
}
