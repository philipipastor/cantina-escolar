import { CalendarDays, ChevronDown } from "lucide-react"
import { formatMonth, formatShortMonth } from "../../../lib/dates"

type MonthSelectProps = {
  value: string
  max: string
  // Ao lado de outro seletor, mostra o mês abreviado ("Nov. 2026") para caber sem cortar.
  compact?: boolean
  onChange: (month: string) => void
}

/**
 * Seletor de mês no visual do Figma ("Outubro de 2026"). Como no campo de data, o seletor é o nativo
 * do aparelho: o <input type="month"> invisível cobre a linha inteira e abre com um toque.
 */
export function MonthSelect({ value, max, compact, onChange }: MonthSelectProps) {
  return (
    <label className="relative flex h-10.5 min-w-0 items-center justify-between gap-2 rounded-field border border-line bg-surface px-3.5 focus-within:border-primary">
      <span className="flex min-w-0 items-center gap-2">
        <CalendarDays className="size-4.25 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
        <span className="sr-only">Mês do resumo</span>
        <span aria-hidden className="truncate text-small font-semibold">
          {compact ? formatShortMonth(value) : formatMonth(value)}
        </span>
      </span>
      <ChevronDown className="size-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
      <input
        type="month"
        value={value}
        max={max}
        required
        // Limpar o campo deixaria a tela sem mês; nesse caso, mantém o anterior.
        onChange={(event) => {
          if (event.target.value) onChange(event.target.value)
        }}
        className="absolute inset-0 opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full"
      />
    </label>
  )
}
