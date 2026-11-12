import { formatCents } from "./money"

// Envio de mensagens prontas (saldo, comprovante) pelo WhatsApp, sem API paga: o sistema só abre a
// conversa com o texto escrito, e quem envia é a pessoa da cantina, revisando antes de tocar em Enviar.

// O formatador do navegador separa "R$" do valor com um espaço especial (não separável, código 160);
// na mensagem, vira um espaço comum para sair igual em qualquer aplicativo.
const NO_BREAK_SPACE = String.fromCharCode(160)

export function formatMoneyForMessage(cents: number) {
  return formatCents(cents).replaceAll(NO_BREAK_SPACE, " ")
}

// Telefone no formato do WhatsApp: só dígitos, com o 55 do Brasil. "(11) 99999-8888" vira "5511999998888".
// Aceita DDD + número (10 ou 11 dígitos) ou o número já com 55. Fora disso, devolve null.
export function toWhatsAppNumber(phone: string | null) {
  const digits = (phone ?? "").replace(/\D/g, "")
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) return digits
  return null
}

// O que o envio precisa: a mensagem pronta e o telefone do cliente, que abre a conversa no WhatsApp.
export type MessageShare = { message: string; phone: string | null }

// Como a mensagem saiu: pelo WhatsApp, pelo menu de compartilhar, copiada, ou para a pessoa copiar da tela.
// "cancelled": a pessoa fechou o menu de compartilhar sem escolher nada.
export type ShareResult = "whatsapp" | "shared" | "cancelled" | "copied" | "manual"

// Único ponto de envio do sistema, em ordem de preferência:
// 1. Cliente com telefone: abre a conversa dele no WhatsApp (link oficial wa.me) com a mensagem escrita.
// 2. Sem telefone: abre o menu de compartilhar do celular (WhatsApp, SMS...), e a pessoa escolhe o contato.
// 3. Navegador sem esse menu (como alguns computadores): copia a mensagem para colar onde quiser.
// Chame direto no clique, com os dados já carregados: o navegador só abre outra janela logo após o toque.
export async function shareMessage({ message, phone }: MessageShare): Promise<ShareResult> {
  const number = toWhatsAppNumber(phone)
  if (number) {
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank", "noopener")
    return "whatsapp"
  }

  if (navigator.share) {
    try {
      await navigator.share({ text: message })
      return "shared"
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled"
      // Qualquer outro erro: tenta copiar.
    }
  }

  try {
    await navigator.clipboard.writeText(message)
    return "copied"
  } catch {
    return "manual"
  }
}
