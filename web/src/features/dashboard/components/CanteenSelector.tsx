import { useState } from "react"
import { Check, ChevronDown, Store } from "lucide-react"
import { BottomSheet } from "../../../components/ui/BottomSheet"
import { cn } from "../../../lib/cn"
import type { Canteen } from "../../canteens/types"

type CanteenSelectorProps = {
  canteen: Canteen
  // Cantinas que podem ser escolhidas. Com uma só, o nome só informa, sem abrir a lista.
  options: Canteen[]
  onSelect: (id: string) => void
}

// Nome da cantina no cabeçalho vermelho. Para o admin, abre a lista para trocar de cantina.
export function CanteenSelector({ canteen, options, onSelect }: CanteenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const canChoose = options.length > 1

  const content = (
    <>
      <Store className="size-5.5 shrink-0" strokeWidth={1.5} aria-hidden />
      <span className="truncate text-small font-semibold">{canteen.name}</span>
      {canChoose && <ChevronDown className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />}
    </>
  )
  const rowClass = "flex max-w-full items-center gap-2 text-white"

  return (
    <>
      {canChoose ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          aria-label={`Cantina selecionada: ${canteen.name}. Trocar de cantina`}
          className={cn(rowClass, "rounded-md focus-visible:outline-2 focus-visible:outline-white")}
        >
          {content}
        </button>
      ) : (
        <p className={rowClass}>{content}</p>
      )}

      {isOpen && (
        <BottomSheet title="Escolher cantina" onClose={() => setIsOpen(false)}>
          <ul className="flex flex-col gap-2 overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.id === canteen.id
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    aria-current={isSelected || undefined}
                    onClick={() => {
                      onSelect(option.id)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "flex h-12 w-full items-center gap-2.5 rounded-field border px-3.5 text-left text-small font-semibold",
                      isSelected
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-line hover:bg-page",
                    )}
                  >
                    <Store className="size-4.5 shrink-0" strokeWidth={1.5} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{option.name}</span>
                    {isSelected && <Check className="size-4.5 shrink-0" aria-hidden />}
                  </button>
                </li>
              )
            })}
          </ul>
        </BottomSheet>
      )}
    </>
  )
}
