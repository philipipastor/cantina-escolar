import { Avatar } from "../../../components/ui/Avatar"
import { cn } from "../../../lib/cn"

type ConsumerPickerProps = {
  options: { value: string; label: string; avatarName: string }[]
  value: string | null
  onChange: (value: string) => void
}

// "Quem consumiu?": pílulas com as iniciais. A selecionada fica com a borda vermelha, como no Figma.
export function ConsumerPicker({ options, value, onChange }: ConsumerPickerProps) {
  return (
    <div role="radiogroup" aria-label="Quem consumiu?" className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-10.5 items-center gap-2 rounded-full border py-1 pr-3.5 pl-1.5 text-small transition",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              isSelected
                ? "border-primary bg-primary-soft font-semibold text-primary"
                : "border-line bg-surface text-muted",
            )}
          >
            <Avatar
              name={option.avatarName}
              variant={isSelected ? "accent" : "neutral"}
              className={cn("size-7 text-nav", isSelected && "bg-primary-tint")}
            />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
