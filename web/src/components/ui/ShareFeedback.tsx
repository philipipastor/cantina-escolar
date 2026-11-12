import type { ShareResult } from "../../lib/whatsapp"
import { Alert } from "./Alert"

// Aviso abaixo de um botão de envio, conforme o caminho que a mensagem tomou (ver shareMessage).
export function ShareFeedback({ result, message }: { result: ShareResult | null; message: string }) {
  if (result === "whatsapp") return <Alert variant="success">WhatsApp aberto com a mensagem pronta.</Alert>
  if (result === "shared") return <Alert variant="success">Mensagem compartilhada.</Alert>
  if (result === "copied")
    return <Alert variant="success">Mensagem copiada. Cole na conversa do cliente.</Alert>
  if (result === "manual") {
    return (
      <Alert variant="note">
        Copie a mensagem:
        <span className="mt-1 block whitespace-pre-line">{message}</span>
      </Alert>
    )
  }
  return null
}
