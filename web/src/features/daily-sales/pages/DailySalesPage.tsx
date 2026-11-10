import { useCallback } from "react"
import { useSearchParams } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { DateSelect } from "../../../components/ui/DateSelect"
import { FilterChips } from "../../../components/ui/FilterChips"
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States"
import { useApiData } from "../../../hooks/useApiData"
import { cn } from "../../../lib/cn"
import { formatNumericDate, todayIso } from "../../../lib/dates"
import { formatCents } from "../../../lib/money"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { fetchDailyReview } from "../api"
import { PaymentRecord } from "../components/PaymentRecord"
import { PurchaseRecord } from "../components/PurchaseRecord"

type Tab = "compras" | "pagamentos"

const tabs: { value: Tab; label: string }[] = [
  { value: "compras", label: "Compras" },
  { value: "pagamentos", label: "Pagamentos" },
]

function Figure({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1.75 rounded-card border border-line bg-surface p-3.5",
        className,
      )}
    >
      <span className="text-mini text-muted">{label}</span>
      <span className="truncate text-total font-bold">{value}</span>
    </div>
  )
}

const countLabel = (count: number) => `${count} ${count === 1 ? "registro" : "registros"}`

/**
 * Conferência do dia: o que foi vendido e recebido, para comparar com o caderno e o caixa.
 * Data e aba ficam na URL, então voltar dos detalhes de um lançamento mantém o mesmo dia e aba.
 */
export function DailySalesPage() {
  const canteen = useCurrentCanteen()
  const [params, setParams] = useSearchParams()
  const today = todayIso()
  const date = params.get("data") ?? today
  const tab: Tab = params.get("aba") === "pagamentos" ? "pagamentos" : "compras"
  const isToday = date === today

  const load = useCallback(() => fetchDailyReview(canteen.id, date), [canteen.id, date])
  const { data, error, reload } = useApiData(load)
  // Enquanto o novo dia não chega, não mostra os números do dia anterior.
  const review = data?.date === date ? data : null

  function update(next: { data?: string; aba?: Tab }) {
    const merged = { data: date, aba: tab, ...next }
    setParams(
      {
        ...(merged.data !== today && { data: merged.data }),
        ...(merged.aba !== "compras" && { aba: merged.aba }),
      },
      { replace: true },
    )
  }

  // Compras e recebimentos; saldos anteriores e os estornos em si não são vendas nem pagamentos.
  const records =
    review?.entries
      .filter((entry) =>
        tab === "compras"
          ? entry.type === "PURCHASE"
          : entry.type === "PAYMENT" || entry.type === "CREDIT_REFUND",
      )
      .reverse() ?? []

  // Os cartões do topo acompanham a aba. Nos pagamentos, contam só os recebimentos não estornados,
  // os mesmos que a API soma no total (devoluções de crédito são dinheiro saindo, não entrando).
  const figures =
    tab === "compras"
      ? {
          total: isToday ? "Total de Vendas Hoje" : "Total de Vendas no Dia",
          count: "Pedidos",
          cents: review?.totals.purchasesCents,
          quantity: review?.totals.purchasesCount,
        }
      : {
          total: isToday ? "Total de Pagamentos Hoje" : "Total de Pagamentos no Dia",
          count: "Pagamentos",
          cents: review?.totals.paymentsCents,
          quantity: review?.entries.filter((entry) => entry.type === "PAYMENT" && !entry.isReversed).length,
        }

  return (
    <PageContainer>
      <PageHeader
        title="Vendas do Dia"
        subtitle={isToday ? "Resumo das vendas de hoje" : `Resumo das vendas de ${formatNumericDate(date)}`}
        back={{ to: "/", label: "Início" }}
      />
      <div className="flex flex-col gap-4.5 px-5 pb-6">
        <div className="flex gap-2.5">
          <Figure
            label={figures.total}
            value={figures.cents === undefined ? "–" : formatCents(figures.cents)}
            className="flex-1"
          />
          <Figure
            label={figures.count}
            value={figures.quantity === undefined ? "–" : String(figures.quantity)}
            className="w-28.5 shrink-0"
          />
        </div>

        <DateSelect
          label="Data das vendas"
          value={date}
          max={today}
          displayText={formatNumericDate(date)}
          className="h-12.25 gap-2 rounded-card px-4 text-caption"
          onChange={(value) => update({ data: value })}
        />

        <FilterChips
          label="Tipo de registro"
          options={tabs}
          value={tab}
          onChange={(value) => update({ aba: value })}
        />

        <section aria-labelledby="records-title" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 id="records-title" className="text-section font-semibold">
              {tab === "compras" ? "Compras" : "Pagamentos"}
            </h2>
            {review && (
              <span className="text-mini leading-[13px] font-medium text-muted">
                {countLabel(records.length)}
              </span>
            )}
          </div>

          {error && !review ? (
            <ErrorState message={error.message} onRetry={reload} />
          ) : !review ? (
            <LoadingState label="Carregando registros do dia" />
          ) : records.length === 0 ? (
            <EmptyState
              title={tab === "compras" ? "Nenhuma compra neste dia" : "Nenhum pagamento neste dia"}
              description="Escolha outra data para conferir."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {records.map((entry) =>
                entry.type === "PURCHASE" ? (
                  <PurchaseRecord key={entry.id} entry={entry} />
                ) : (
                  <PaymentRecord key={entry.id} entry={entry} />
                ),
              )}
            </ul>
          )}
        </section>
      </div>
    </PageContainer>
  )
}
