import { cn } from "../../lib/cn"

type FilterChipsProps<T extends string> = {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

// Pílulas de filtro do Figma: 35px de altura, ativa em rosado e inativa com borda.
export function FilterChips<T extends string>({ label, options, value, onChange }: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8.75 rounded-full border px-3.5 text-caption transition",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              isActive
                ? "border-primary-soft bg-primary-soft font-semibold text-primary"
                : "border-line bg-surface text-muted",
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
