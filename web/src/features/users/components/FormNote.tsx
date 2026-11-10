import type { ReactNode } from "react"
import { Info } from "lucide-react"

// Orientação cinza no fim dos formulários de usuário, como no Figma de Novo usuário.
export function FormNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2.5 rounded-field bg-avatar p-3.5 text-caption text-muted">
      <Info className="size-4.25 shrink-0" strokeWidth={1.5} aria-hidden />
      {children}
    </p>
  )
}
