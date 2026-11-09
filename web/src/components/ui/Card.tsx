import type { HTMLAttributes } from "react"
import { cn } from "../../lib/cn"

// Cartão branco com borda #E8EAEE. O Figma usa cantos de 16px nos blocos grandes e 12px nos menores.
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-card border border-line bg-surface", className)} {...props} />
}
