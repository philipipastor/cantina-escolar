import { Minus, Plus, Trash2 } from "lucide-react"
import { formatCents } from "../../../lib/money"
import { ProductThumb } from "../../products/components/ProductThumb"
import type { SaleItem } from "../types"

// Limite da API para a quantidade de um item.
const MAX_QUANTITY = 1000

type SaleItemRowProps = {
  item: SaleItem
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

export function SaleItemRow({ item, onQuantityChange, onRemove }: SaleItemRowProps) {
  return (
    <li className="flex flex-col gap-3 p-3.5">
      <div className="flex items-center gap-3">
        <ProductThumb />
        <div className="min-w-0 flex-1">
          <p className="truncate text-small font-semibold">{item.name}</p>
          <p className="text-nav text-muted">{formatCents(item.unitPriceCents)}</p>
        </div>
        <span className="text-body font-bold">{formatCents(item.quantity * item.unitPriceCents)}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-nav text-muted">Quantidade</span>
        <div className="flex items-center gap-3">
          <div className="flex h-8 items-center rounded-[10px] border border-line">
            <button
              type="button"
              aria-label={`Diminuir ${item.name}`}
              disabled={item.quantity <= 1}
              onClick={() => onQuantityChange(item.quantity - 1)}
              className="flex h-full w-8 items-center justify-center text-muted disabled:opacity-40"
            >
              <Minus className="size-3.5" strokeWidth={1.5} aria-hidden />
            </button>
            <span aria-live="polite" className="min-w-6 text-center text-caption font-semibold">
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label={`Aumentar ${item.name}`}
              disabled={item.quantity >= MAX_QUANTITY}
              onClick={() => onQuantityChange(item.quantity + 1)}
              className="flex h-full w-8 items-center justify-center text-primary disabled:opacity-40"
            >
              <Plus className="size-3.5" strokeWidth={1.5} aria-hidden />
            </button>
          </div>
          <button
            type="button"
            aria-label={`Remover ${item.name}`}
            onClick={onRemove}
            className="flex size-8 items-center justify-center text-muted hover:text-primary"
          >
            <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      </div>
    </li>
  )
}
