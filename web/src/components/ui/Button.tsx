import type { ButtonHTMLAttributes } from "react"
import { LoaderCircle } from "lucide-react"
import { cn } from "../../lib/cn"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost"
  loading?: boolean
}

const variants = {
  primary: "bg-primary text-white hover:brightness-95",
  outline: "border border-primary bg-surface text-primary hover:bg-primary-soft",
  ghost: "text-muted hover:text-ink",
}

// Botões do Figma: 50px de altura, cantos de 12px e texto SemiBold 14.
export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "flex h-12.5 w-full items-center justify-center gap-2 rounded-field text-body font-semibold transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        variant === "ghost" && "h-auto w-auto",
        className,
      )}
      {...props}
    >
      {loading && <LoaderCircle className="size-4.5 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
