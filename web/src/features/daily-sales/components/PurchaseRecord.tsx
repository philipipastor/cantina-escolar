import { UserRound } from "lucide-react"
import { cn } from "../../../lib/cn"
import { formatCents } from "../../../lib/money"
import type { Entry } from "../../sales/types"
import { RecordCard } from "./RecordCard"

// Compra do dia: itens, cliente e total. Uma compra estornada continua na lista, identificada.
export function PurchaseRecord({ entry }: { entry: Entry }) {
  return (
    <RecordCard
      entry={entry}
      badge={
        entry.isReversed
          ? { label: "Estornada", tone: "neutral" }
          : { label: "Compra no fiado", tone: "primary" }
      }
    >
      <ul className="flex flex-col gap-2">
        {entry.items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-caption">
            <span className="min-w-0 flex-1">
              {item.quantity} × {item.description}
            </span>
            <span className="shrink-0">{formatCents(item.subtotalCents)}</span>
          </li>
        ))}
      </ul>
      <hr className="border-line" />
      <div className="flex items-center justify-between gap-2.25">
        <span className="flex min-w-0 flex-1 items-center gap-1.75 text-mini text-muted">
          <UserRound className="size-3.75 shrink-0" strokeWidth={1.5} aria-hidden />
          <span className="truncate">Cliente: {entry.client.name}</span>
        </span>
        <span className="flex shrink-0 items-baseline gap-2">
          <span className="text-caption leading-[15px] text-muted">Total da compra</span>
          <span
            className={cn("text-price font-bold text-primary", entry.isReversed && "text-muted line-through")}
          >
            {formatCents(-entry.amountCents)}
          </span>
        </span>
      </div>
    </RecordCard>
  )
}
