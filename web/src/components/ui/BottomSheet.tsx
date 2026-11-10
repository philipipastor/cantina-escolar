import { useEffect, useRef, type ReactNode } from "react"
import { X } from "lucide-react"

/**
 * Painel que sobe da parte de baixo da tela, para escolher algo sem sair da página.
 * Usa o <dialog> nativo: o navegador já prende o foco dentro dele e fecha com a tecla Esc.
 * Para abrir, monte o componente; para fechar, desmonte.
 */
export function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialog}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        // O conteúdo cobre todo o painel, então um clique no próprio <dialog> só pode ser no fundo escuro.
        if (event.target === dialog.current) onClose()
      }}
      className="mx-auto mt-auto mb-0 w-full max-w-120 rounded-t-card bg-surface text-ink backdrop:bg-ink/40"
    >
      <div className="flex max-h-[80dvh] flex-col gap-3.5 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-section font-semibold">{title}</h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="-mr-1 flex size-8 items-center justify-center rounded-full text-muted hover:text-ink"
          >
            <X className="size-4.5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
