import { Calendar, ChevronDown } from "lucide-react"
import { cn } from "../../lib/cn"

type DateSelectProps = {
  label: string
  value: string
  max?: string
  // Texto no lugar da data do navegador, como "Hoje, 26 out. 2026".
  displayText?: string
  className?: string
  onChange: (value: string) => void
}

/**
 * Campo de data no visual do Figma. O calendário continua sendo o nativo do aparelho, que já é
 * familiar e acessível: o indicador invisível cobre a linha toda para abrir com um toque em qualquer ponto.
 */
export function DateSelect({ label, value, max, displayText, className, onChange }: DateSelectProps) {
  return (
    <label
      className={cn(
        "relative flex h-11 items-center gap-2 rounded-field border border-line bg-surface px-3.5 text-small focus-within:border-primary",
        className,
      )}
    >
      <Calendar className="size-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
      <span className="sr-only">{label}</span>
      {displayText && (
        <span aria-hidden className="min-w-0 flex-1">
          {displayText}
        </span>
      )}
      <input
        type="date"
        value={value}
        max={max}
        required
        // Limpar o campo deixaria a operação sem data; nesse caso, mantém a anterior.
        onChange={(event) => {
          if (event.target.value) onChange(event.target.value)
        }}
        className={cn(
          "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:opacity-0",
          displayText ? "absolute inset-0 opacity-0" : "h-full min-w-0 flex-1 bg-transparent outline-none",
        )}
      />
      <ChevronDown className="size-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
    </label>
  )
}
