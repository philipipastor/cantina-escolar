import { Package } from "lucide-react"

// O Figma usa um ícone por produto, mas o cadastro não guarda essa informação: todos usam o mesmo.
export function ProductThumb() {
  return (
    <span
      aria-hidden
      className="flex size-9.5 shrink-0 items-center justify-center rounded-[10px] bg-page text-muted"
    >
      <Package className="size-4.5" strokeWidth={1.5} />
    </span>
  )
}
