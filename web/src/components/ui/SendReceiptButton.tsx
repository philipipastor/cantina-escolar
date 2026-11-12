import { Send } from "lucide-react"
import { useShareMessage } from "../../hooks/useShareMessage"
import type { MessageShare } from "../../lib/whatsapp"
import { Alert } from "./Alert"
import { Button } from "./Button"
import { ShareFeedback } from "./ShareFeedback"

type SendReceiptButtonProps = {
  // Monta o comprovante na hora do toque. Nulo enquanto os dados (telefone, saldo) ainda carregam.
  prepare: (() => MessageShare) | null
  isLoading?: boolean
  loadFailed?: boolean
}

// Botão "Enviar Comprovante" de vendas e recebimentos: abre o WhatsApp do cliente com o comprovante
// pronto (ver shareMessage) e mostra, logo abaixo, como a mensagem saiu.
export function SendReceiptButton({ prepare, isLoading, loadFailed }: SendReceiptButtonProps) {
  const receipt = useShareMessage()

  return (
    <>
      <Button disabled={!prepare} loading={isLoading} onClick={() => prepare && receipt.share(prepare())}>
        <Send className="size-4.5" strokeWidth={1.5} aria-hidden />
        Enviar Comprovante
      </Button>
      {loadFailed && (
        <Alert>Não foi possível carregar o telefone e o saldo do cliente para o comprovante.</Alert>
      )}
      <ShareFeedback result={receipt.result} message={receipt.message} />
    </>
  )
}
