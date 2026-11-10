import { cn } from "../../../lib/cn"
import type { Child } from "../types"

type ChildChipsProps = {
  // Só os filhos ativos aparecem; sem nenhum, o componente não mostra nada.
  items: Child[]
  // "filled": chip cinza do Receber pagamento. "outlined": chip claro com borda do Relatório do cliente.
  variant?: "filled" | "outlined"
}

// No Figma a borda fica por dentro do chip; aqui ela soma 1px, por isso o espaçamento interno é 1px menor.
const variants = {
  filled: {
    chip: "bg-chip py-0.75 pr-2 pl-1.5",
    initial: "text-[8px]",
    name: "text-mini leading-[1.2]",
  },
  outlined: {
    chip: "border border-line bg-page py-0.5 pr-1.75 pl-1.25",
    initial: "text-[9px]",
    name: "text-nav",
  },
}

// Filhos vinculados ao cliente, como no Figma: inicial em um círculo rosa e o nome ao lado.
export function ChildChips({ items, variant = "filled" }: ChildChipsProps) {
  const active = items.filter((child) => child.isActive)
  if (active.length === 0) return null
  const styles = variants[variant]

  // Spans com papel de lista: o chip também aparece dentro de botões, onde <ul> não é permitido.
  return (
    <span role="list" aria-label="Filhos vinculados" className="flex flex-wrap gap-1.5">
      {active.map((child) => (
        <span
          role="listitem"
          key={child.id}
          className={cn(
            "flex items-center gap-1 rounded-full font-medium text-muted",
            styles.chip,
            styles.name,
          )}
        >
          <span
            aria-hidden
            className={cn(
              "flex size-4 items-center justify-center rounded-full bg-primary-tint leading-none font-bold text-chip-initial",
              styles.initial,
            )}
          >
            {child.name.charAt(0).toUpperCase()}
          </span>
          {child.name}
        </span>
      ))}
    </span>
  )
}
