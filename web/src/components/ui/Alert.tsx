import type { ReactNode } from "react"
import { CircleAlert, CircleCheck } from "lucide-react"
import { cn } from "../../lib/cn"

type AlertProps = {
  // "note" tem o visual do erro, mas é um lembrete fixo da tela: não é anunciado como um problema.
  variant?: "error" | "success" | "note"
  children: ReactNode
}

// Avisos nas cores do Figma: rosado para erro e lembretes, verde para confirmação.
export function Alert({ variant = "error", children }: AlertProps) {
  const isSuccess = variant === "success"
  const Icon = isSuccess ? CircleCheck : CircleAlert
  const role = variant === "error" ? "alert" : isSuccess ? "status" : undefined

  return (
    <div
      role={role}
      className={cn(
        "flex items-start gap-2 rounded-field p-3",
        variant === "note" ? "text-caption" : "text-small",
        isSuccess
          ? "border border-success-line bg-success-soft text-success"
          : "bg-primary-soft text-primary",
      )}
    >
      <Icon className="mt-px size-4 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  )
}
