import { ChevronDown, Store } from "lucide-react"
import type { Canteen } from "../../canteens/types"

export const ALL_CANTEENS = "todas"

type CanteenFilterProps = {
  canteens: Canteen[]
  value: string
  onChange: (value: string) => void
}

/**
 * Escolha de quais cantinas o Resumo soma, no mesmo visual do seletor de mês. Por baixo é um <select>
 * nativo e invisível sobre a linha toda: no celular, abre a lista do próprio sistema.
 */
export function CanteenFilter({ canteens, value, onChange }: CanteenFilterProps) {
  const selected = canteens.find((canteen) => canteen.id === value)

  return (
    <label className="relative flex h-10.5 min-w-0 items-center justify-between gap-2 rounded-field border border-line bg-surface px-3.5 focus-within:border-primary">
      <span className="flex min-w-0 items-center gap-2">
        <Store className="size-4.25 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
        <span aria-hidden className="truncate text-small font-semibold">
          {selected?.name ?? "Todas"}
        </span>
      </span>
      <ChevronDown className="size-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
      <select
        aria-label="Cantinas do resumo"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value={ALL_CANTEENS}>Todas as cantinas</option>
        {canteens.map((canteen) => (
          <option key={canteen.id} value={canteen.id}>
            {canteen.isActive ? canteen.name : `${canteen.name} (inativa)`}
          </option>
        ))}
      </select>
    </label>
  )
}
