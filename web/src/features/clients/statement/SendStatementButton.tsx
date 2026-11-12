import { useState } from "react"
import { Download, MessageCircle, Send } from "lucide-react"
import { Alert } from "../../../components/ui/Alert"
import { Button } from "../../../components/ui/Button"
import { toWhatsAppNumber } from "../../../lib/whatsapp"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { fetchFullStatement } from "../api"
import type { Client } from "../types"
import { downloadFile, shareFile, type FileShareResult } from "./shareStatement"
import { createStatementPdf } from "./statementPdf"
import { buildStatementReport } from "./statementReport"

type Prepared = { key: string; file: File; title: string }
type Status = "shared" | "cancelled" | "needs-tap" | "downloaded" | "error"

type SendStatementButtonProps = {
  client: Pick<Client, "id" | "name" | "phone">
  // Período aplicado no filtro da tela (datas AAAA-MM-DD, as duas inclusas).
  period: { from: string; to: string }
}

// "Enviar extrato": gera o PDF do período filtrado e abre o compartilhamento do aparelho, para enviar
// pelo WhatsApp. Nada é gravado: só lê o extrato.
export function SendStatementButton({ client, period }: SendStatementButtonProps) {
  const canteen = useCurrentCanteen()
  const key = `${client.id}|${period.from}|${period.to}`
  const [isGenerating, setGenerating] = useState(false)
  const [prepared, setPrepared] = useState<Prepared | null>(null)
  const [statusState, setStatus] = useState<{ key: string; status: Status } | null>(null)
  // Ao trocar de cliente ou de período, o PDF anterior deixa de valer.
  const file = prepared?.key === key ? prepared : null
  const status = statusState?.key === key ? statusState.status : null
  const phone = toWhatsAppNumber(client.phone)

  async function generate() {
    const statement = await fetchFullStatement(canteen.id, client.id, period.from, period.to)
    const report = buildStatementReport({
      canteenName: canteen.name,
      clientName: client.name,
      from: period.from,
      to: period.to,
      statement,
    })
    const ready = {
      key,
      file: await createStatementPdf(report),
      title: `Extrato de consumo - ${report.title}`,
    }
    setPrepared(ready)
    return ready
  }

  function finish(ready: Prepared, result: FileShareResult) {
    if (result === "unsupported") {
      downloadFile(ready.file)
      setStatus({ key, status: "downloaded" })
      return
    }
    setStatus({ key, status: result })
  }

  async function send() {
    // Com o PDF já pronto, compartilha direto no toque (o iPhone exige isso).
    if (file) return finish(file, await shareFile(file.file, file.title))
    setGenerating(true)
    setStatus(null)
    try {
      const ready = await generate()
      finish(ready, await shareFile(ready.file, ready.title))
    } catch {
      setStatus({ key, status: "error" })
    } finally {
      setGenerating(false)
    }
  }

  function openWhatsApp() {
    if (!phone || !file) return
    const text = `Olá, ${client.name.trim()}. Segue o extrato de consumo da cantina.`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener")
  }

  return (
    <>
      <Button loading={isGenerating} onClick={send}>
        <Send className="size-4.5" strokeWidth={1.5} aria-hidden />
        {status === "needs-tap" ? "Compartilhar PDF" : "Enviar extrato"}
      </Button>

      {status === "needs-tap" && (
        <Alert variant="note">Extrato pronto. Toque em “Compartilhar PDF” e escolha o WhatsApp.</Alert>
      )}
      {status === "shared" && (
        <Alert variant="success">
          Extrato compartilhado: {file?.file.name}. Confirme o envio no WhatsApp.
        </Alert>
      )}
      {status === "error" && <Alert>Não foi possível gerar o extrato. Tente de novo.</Alert>}
      {status === "downloaded" && file && (
        <div className="flex flex-col gap-2.5">
          <Alert variant="note">
            Este navegador não compartilha arquivos. O PDF {file.file.name} foi baixado: abra a conversa do
            cliente no WhatsApp e anexe o arquivo.
          </Alert>
          {phone && (
            <Button variant="outline" onClick={openWhatsApp}>
              <MessageCircle className="size-4.5" strokeWidth={1.5} aria-hidden />
              Abrir conversa no WhatsApp
            </Button>
          )}
        </div>
      )}
      {file && status !== "downloaded" && (
        <Button variant="outline" onClick={() => downloadFile(file.file)}>
          <Download className="size-4.5" strokeWidth={1.5} aria-hidden />
          Baixar PDF
        </Button>
      )}
    </>
  )
}
