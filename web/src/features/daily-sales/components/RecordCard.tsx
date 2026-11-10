import type { ReactNode } from "react"
import { CalendarDays } from "lucide-react"
import { Link } from "react-router"
import { cn } from "../../../lib/cn"
import { formatLongDate, formatTime } from "../../../lib/dates"
import { formatCents } from "../../../lib/money"
import type { Entry } from "../../sales/types"

type RecordCardProps = {
  entry: Entry
  badge: { label: string; tone: "primary" | "neutral" }
  children: ReactNode
}

// Moldura comum dos registros do dia: data e hora, etiqueta e o conteúdo. Abre os detalhes do lançamento.
export function RecordCard({ entry, badge, children }: RecordCardProps) {
  return (
    <li>
      <Link
        to={`/lancamentos/${entry.id}`}
        // Resumo para leitores de tela, que leriam o cartão inteiro como um link sem nome claro.
        aria-label={`${badge.label}: ${entry.client.name}, ${formatCents(Math.abs(entry.amountCents))}. Ver detalhes`}
        className="flex flex-col gap-3 rounded-card border border-line bg-surface p-3.5 transition hover:bg-page"
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
          <span className="min-w-0 flex-1 text-mini font-medium">
            {formatLongDate(entry.referenceDate)} · {formatTime(entry.recordedAt)}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.25 py-1 text-mini leading-[1.3] font-medium",
              badge.tone === "primary" ? "bg-primary-soft text-primary" : "bg-avatar text-muted",
            )}
          >
            {badge.label}
          </span>
        </div>
        <hr className="border-line" />
        {children}
      </Link>
    </li>
  )
}
