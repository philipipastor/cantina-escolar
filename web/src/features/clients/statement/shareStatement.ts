// Envio do extrato em PDF. O link wa.me só leva texto, então o arquivo vai pelo compartilhamento do
// próprio aparelho (Web Share API com arquivos): no celular, a pessoa escolhe o WhatsApp e confirma o
// envio lá. Onde isso não existe (alguns navegadores de computador), o PDF é baixado e anexado à mão.

export type FileShareResult = "shared" | "cancelled" | "needs-tap" | "unsupported"

export function canShareFile(file: File) {
  try {
    return typeof navigator.share === "function" && !!navigator.canShare?.({ files: [file] })
  } catch {
    return false
  }
}

export async function shareFile(file: File, title: string): Promise<FileShareResult> {
  if (!canShareFile(file)) return "unsupported"
  try {
    await navigator.share({ files: [file], title })
    return "shared"
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled"
    // O iPhone exige que o compartilhamento comece direto de um toque. Se gerar o PDF demorou,
    // ele recusa; com o arquivo já pronto, um novo toque resolve.
    if (error instanceof DOMException && error.name === "NotAllowedError") return "needs-tap"
    return "unsupported"
  }
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement("a")
  link.href = url
  link.download = file.name
  document.body.append(link)
  link.click()
  link.remove()
  // Dá tempo do navegador começar o download antes de liberar o arquivo da memória.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
