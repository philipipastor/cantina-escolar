import type { ReactNode } from "react"
import { CircleAlert } from "lucide-react"

// Aviso de erro no estilo das caixas rosadas do Figma.
export function Alert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-field bg-primary-soft p-3 text-small text-primary"
    >
      <CircleAlert className="mt-px size-4 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  )
}
