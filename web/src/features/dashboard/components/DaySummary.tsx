import { useCallback } from "react"
import { useApiData } from "../../../hooks/useApiData"
import { formatCents } from "../../../lib/money"
import { fetchCanteenSummary } from "../api"

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.75">
      <span className="text-mini text-muted">{label}</span>
      <span className="truncate text-figure font-bold">{value}</span>
    </div>
  )
}

// Cartão branco do cabeçalho com os dois números de hoje. Muda junto com a cantina selecionada.
export function DaySummary({ canteenId }: { canteenId: string }) {
  const load = useCallback(() => fetchCanteenSummary(canteenId), [canteenId])
  const { data, error, reload } = useApiData(load)

  if (error && !data) {
    return (
      <button
        type="button"
        onClick={reload}
        className="rounded-card bg-surface p-3.5 text-left text-caption text-muted"
      >
        Não foi possível carregar o resumo do dia.{" "}
        <span className="font-semibold text-primary">Tentar de novo</span>
      </button>
    )
  }

  return (
    <section
      aria-label="Resumo do dia"
      aria-busy={!data}
      className="flex gap-3 rounded-card bg-surface p-3.5"
    >
      <Figure label="Pedidos realizados hoje" value={data ? String(data.purchasesCount) : "–"} />
      <span aria-hidden className="w-px self-stretch bg-line" />
      <Figure label="Valor total do dia" value={data ? formatCents(data.purchasesCents) : "–"} />
    </section>
  )
}
