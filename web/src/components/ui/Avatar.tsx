import { cn } from "../../lib/cn"
import { initials } from "../../lib/text"

type AvatarProps = {
  name: string
  // "accent" é o rosado do cliente selecionado; "neutral", o cinza das listas.
  variant?: "neutral" | "accent"
  className?: string
}

export function Avatar({ name, variant = "neutral", className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9.5 shrink-0 items-center justify-center rounded-full text-caption font-semibold",
        variant === "neutral" ? "bg-avatar text-muted" : "bg-primary-soft text-primary",
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
