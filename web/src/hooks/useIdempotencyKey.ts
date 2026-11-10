import { useRef } from "react"

/**
 * Chave que impede lançar a mesma operação duas vezes. Se a internet cair depois de enviar, a nova
 * tentativa repete a chave e a API devolve o lançamento original, sem duplicar.
 * Se os dados mudarem, a operação já é outra, então a chave também muda.
 */
export function useIdempotencyKey() {
  const last = useRef<{ key: string; payload: string } | null>(null)

  return (payload: unknown) => {
    const text = JSON.stringify(payload)
    if (last.current?.payload !== text) last.current = { key: crypto.randomUUID(), payload: text }
    return last.current.key
  }
}
