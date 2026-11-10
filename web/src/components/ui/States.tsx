import type { ReactNode } from "react"
import { CircleAlert, LoaderCircle } from "lucide-react"
import { Button } from "./Button"

export function LoadingState({ label = "Carregando" }: { label?: string }) {
  return (
    <div className="flex justify-center py-10 text-primary" role="status" aria-label={label}>
      <LoaderCircle className="size-7 animate-spin" />
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-5 py-8 text-center">
      <p className="text-small font-semibold">{title}</p>
      {description && <p className="text-caption text-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-5 py-8 text-center">
      <CircleAlert className="size-7 text-primary" aria-hidden />
      <p className="text-small text-muted">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="w-auto px-6">
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
