import { CalendarDays, CircleCheck, CircleSlash, UserRound } from "lucide-react"
import { Avatar } from "../../../components/ui/Avatar"
import { Card } from "../../../components/ui/Card"
import { cn } from "../../../lib/cn"
import { formatNumericDate, formatTime } from "../../../lib/dates"
import type { Entry } from "../../sales/types"

type EntryOverviewCardProps = {
  entry: Entry
  // Ex.: "Compra confirmada" / "Compra estornada".
  status: { confirmed: string; reversed: string }
  // Linha abaixo do nome do cliente, como quem consumiu ou a forma de pagamento.
  detail: string | null
}

function StatusBanner({ isReversed, label }: { isReversed: boolean; label: string }) {
  const Icon = isReversed ? CircleSlash : CircleCheck
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-field px-3 py-2.5 text-caption font-semibold",
        isReversed ? "bg-primary-soft text-primary" : "bg-success-soft text-success",
      )}
    >
      <Icon className="size-4.5" aria-hidden />
      {label}
    </div>
  )
}

// Topo das telas de detalhes: situação, cliente, data e quem registrou ou estornou.
export function EntryOverviewCard({ entry, status, detail }: EntryOverviewCardProps) {
  return (
    <Card className="flex flex-col gap-3 p-3.5">
      <StatusBanner
        isReversed={entry.isReversed}
        label={entry.isReversed ? status.reversed : status.confirmed}
      />
      <div className="flex items-center gap-3 border-b border-line pb-3">
        <Avatar name={entry.client.name} variant="accent" className="size-10" />
        <div className="min-w-0">
          <p className="truncate text-small font-semibold">{entry.client.name}</p>
          {detail && <p className="text-nav text-muted">{detail}</p>}
        </div>
      </div>
      <p className="flex items-center gap-2 text-caption text-muted">
        <CalendarDays className="size-4" strokeWidth={1.5} aria-hidden />
        {formatNumericDate(entry.referenceDate)} · {formatTime(entry.recordedAt)}
      </p>
      <p className="flex items-center gap-2 text-caption text-muted">
        <UserRound className="size-4" strokeWidth={1.5} aria-hidden />
        Registrado por {entry.recordedBy.name}
      </p>
      {entry.reversedBy && (
        <p className="border-t border-line pt-3 text-caption text-muted">
          Estorno feito por {entry.reversedBy.user.name}. Motivo: {entry.reversedBy.reason}
        </p>
      )}
    </Card>
  )
}
