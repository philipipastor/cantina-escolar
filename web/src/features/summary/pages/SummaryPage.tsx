import { useCallback } from "react"
import { ArrowDownLeft, NotebookPen, Wallet, type LucideIcon } from "lucide-react"
import { useSearchParams } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { ErrorState } from "../../../components/ui/States"
import { useApiData } from "../../../hooks/useApiData"
import { currentMonthIso, monthRange } from "../../../lib/dates"
import { formatCents } from "../../../lib/money"
import { useAuth } from "../../auth/AuthContext"
import { useCanteen, useCurrentCanteen } from "../../canteens/CanteenContext"
import { fetchAllCanteensSummary, fetchCanteenSummary } from "../../dashboard/api"
import { ALL_CANTEENS, CanteenFilter } from "../components/CanteenFilter"
import { MonthSelect } from "../components/MonthSelect"

function MonthFigure({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-card border border-line bg-surface p-3.5">
      <span className="flex items-center gap-1.5 text-mini text-muted">
        <Icon className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
        {label}
      </span>
      <span className="truncate text-metric font-bold">{value}</span>
    </div>
  )
}

const debtorsText = (count: number) =>
  count === 0
    ? "Nenhum cliente com saldo em aberto"
    : `${count} ${count === 1 ? "cliente" : "clientes"} com saldo em aberto`

// O total a receber é a posição de agora; fiado e recebido valem para o mês, sem estornados.
// `scope` é o id de uma cantina ou ALL_CANTEENS, que soma todas (só para o admin).
function SummaryFigures({ scope, month }: { scope: string; month: string }) {
  const load = useCallback(() => {
    const period = monthRange(month)
    return scope === ALL_CANTEENS ? fetchAllCanteensSummary(period) : fetchCanteenSummary(scope, period)
  }, [scope, month])
  const { data, error, reload } = useApiData(load)
  const money = (cents: number | undefined) => (cents === undefined ? "–" : formatCents(cents))

  if (error && !data) return <ErrorState message={error.message} onRetry={reload} />

  return (
    <section aria-label="Indicadores financeiros" aria-busy={!data} className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1.25 rounded-card bg-primary p-4.5 text-white">
        <div className="flex items-center justify-between">
          <span className="text-caption">Total a receber</span>
          <Wallet className="size-5" strokeWidth={1.5} aria-hidden />
        </div>
        <span className="truncate text-hero font-bold">{money(data?.receivableCents)}</span>
        <span className="text-mini">{data ? debtorsText(data.debtorAccounts) : " "}</span>
      </div>
      <div className="flex gap-2.5">
        <MonthFigure icon={NotebookPen} label="Fiado no mês" value={money(data?.purchasesCents)} />
        <MonthFigure icon={ArrowDownLeft} label="Recebido no mês" value={money(data?.paymentsCents)} />
      </div>
    </section>
  )
}

/**
 * Visão financeira. O admin escolhe uma cantina ou todas (padrão); o funcionário vê só a dele.
 * Mês e cantina ficam na URL (?mes=AAAA-MM&cantina=id), sem mudar a cantina selecionada no app.
 */
export function SummaryPage() {
  const { user } = useAuth()
  const { canteens } = useCanteen()
  const canteen = useCurrentCanteen()
  const [params, setParams] = useSearchParams()
  const thisMonth = currentMonthIso()
  const month = params.get("mes") ?? thisMonth
  const isAdmin = user?.role === "ADMIN"

  const requested = params.get("cantina")
  const scope = !isAdmin
    ? canteen.id
    : canteens.some((item) => item.id === requested)
      ? requested!
      : ALL_CANTEENS

  function update(next: { mes?: string; cantina?: string }) {
    const merged = { mes: month, cantina: scope, ...next }
    setParams(
      {
        ...(merged.mes !== thisMonth && { mes: merged.mes }),
        ...(isAdmin && merged.cantina !== ALL_CANTEENS && { cantina: merged.cantina }),
      },
      { replace: true },
    )
  }

  return (
    <PageContainer>
      <PageHeader title="Seu negócio em dia" subtitle="Um olhar simples para as contas do comércio." />
      <div className="flex flex-col gap-4.5 px-5 pb-6">
        {/* Lado a lado, dividindo a largura; sem a lista de cantinas, o mês ocupa a linha toda. */}
        <div className="grid auto-cols-fr grid-flow-col gap-2.5">
          <MonthSelect
            compact={isAdmin}
            value={month}
            max={thisMonth}
            onChange={(value) => update({ mes: value })}
          />
          {isAdmin && (
            <CanteenFilter
              canteens={canteens}
              value={scope}
              onChange={(value) => update({ cantina: value })}
            />
          )}
        </div>
        {/* A chave refaz a busca do zero ao trocar de mês ou cantina, sem mostrar números antigos. */}
        <SummaryFigures key={`${scope}-${month}`} scope={scope} month={month} />
      </div>
    </PageContainer>
  )
}
