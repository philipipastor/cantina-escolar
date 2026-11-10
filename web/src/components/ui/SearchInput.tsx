import type { InputHTMLAttributes } from "react"
import { Search } from "lucide-react"

// Busca do Figma: campo branco com a lupa à esquerda.
export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-field border border-line bg-surface px-3.5 transition focus-within:border-primary">
      <Search className="size-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
      <input
        type="search"
        className="h-full min-w-0 flex-1 bg-transparent text-small text-ink outline-none placeholder:text-muted"
        {...props}
      />
    </label>
  )
}
