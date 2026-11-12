import { useState } from "react"
import { shareMessage, type MessageShare, type ShareResult } from "../lib/whatsapp"

// Envia uma mensagem pronta e guarda como ela saiu, para a tela mostrar o aviso (ShareFeedback).
export function useShareMessage() {
  const [sent, setSent] = useState<{ message: string; result: ShareResult } | null>(null)

  async function share(content: MessageShare) {
    setSent({ message: content.message, result: await shareMessage(content) })
  }

  return { share, result: sent?.result ?? null, message: sent?.message ?? "" }
}
