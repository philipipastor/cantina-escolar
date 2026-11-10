import { useCallback, useState } from "react"
import { ChevronRight, HandCoins, Send } from "lucide-react"
import { Link, useLocation, useNavigate, useParams } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { Alert } from "../../../components/ui/Alert"
import { Avatar } from "../../../components/ui/Avatar"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States"
import { useApiData } from "../../../hooks/useApiData"
import { cn } from "../../../lib/cn"
import { firstDayOfMonthIso, formatDayMonth, formatLongDate, todayIso } from "../../../lib/dates"
import { formatCents } from "../../../lib/money"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { fetchClient, fetchStatement } from "../api"
import { BalanceSummary } from "../components/BalanceValue"
import { ChildChips } from "../components/ChildChips"
import { EntryCard } from "../components/EntryCard"
import type { Balance } from "../types"

const balanceColors = { DEBT: "text-primary", CREDIT: "text-success", ZERO: "text-muted" }

function DateInput(props: { label: string; value: string; max?: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5 text-nav text-muted">
      {props.label}
      <input
        type="date"
        value={props.value}
        max={props.max}
        onChange={(event) => props.onChange(event.target.value)}
        className="h-11 w-full min-w-0 rounded-field border border-line bg-surface px-2.5 text-caption text-ink outline-none focus:border-primary"
      />
    </label>
  )
}

function CurrentBalance({ balance }: { balance: Balance }) {
  return (
    <span className={cn("text-caption font-bold", balanceColors[balance.status])}>
      {formatCents(Math.abs(balance.balanceCents))}
    </span>
  )
}

export function ClientReportPage() {
  const canteen = useCurrentCanteen()
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const notice = location.state as { warning?: string; success?: string } | null

  const [draft, setDraft] = useState({ from: firstDayOfMonthIso(), to: todayIso() })
  const [period, setPeriod] = useState(draft)

  const loadClient = useCallback(() => fetchClient(canteen.id, id), [canteen.id, id])
  const loadStatement = useCallback(
    () => fetchStatement(canteen.id, id, period.from, period.to),
    [canteen.id, id, period],
  )
  const client = useApiData(loadClient)
  const statement = useApiData(loadStatement)

  function clearFilter() {
    const initial = { from: firstDayOfMonthIso(), to: todayIso() }
    setDraft(initial)
    setPeriod(initial)
  }

  if (client.error && !client.data) {
    return <ErrorState message={client.error.message} onRetry={client.reload} />
  }
  if (!client.data) return <LoadingState label="Carregando cliente" />

  const { name, children, balance, isActive } = client.data
  // A API entrega do mais antigo para o mais recente; a tela mostra o mais recente primeiro.
  const entries = [...(statement.data?.entries ?? [])].reverse()
  const isInvalidPeriod = !draft.from || !draft.to || draft.from > draft.to

  return (
    <PageContainer>
      <PageHeader title="Relatório do cliente" subtitle="Compras e pagamentos, tudo em um só lugar." />
      <div className="flex flex-col gap-3.5 px-5">
        {notice?.warning && <Alert>{notice.warning}</Alert>}
        {notice?.success && <Alert variant="success">{notice.success}</Alert>}

        <section aria-label="Cliente" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-small font-semibold">Cliente</h2>
            <Link to="/clientes" className="text-mini font-semibold text-primary hover:underline">
              Trocar cliente
            </Link>
          </div>
          <Link to={`/clientes/${id}/editar`} className="block rounded-field">
            <Card className="flex items-center gap-3 rounded-field p-3.5 transition hover:bg-page">
              <Avatar name={name} variant="accent" className="size-10.5 text-body" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate text-body font-semibold">
                  {name}
                  {!isActive && <span className="font-normal text-muted"> (inativo)</span>}
                </p>
                <BalanceSummary balance={balance} />
                <ChildChips items={children} variant="outlined" />
              </div>
              <span className="flex items-center gap-0.5 text-nav text-muted">
                Editar
                <ChevronRight className="size-4" strokeWidth={1.5} aria-hidden />
              </span>
            </Card>
          </Link>
        </section>

        <Card className="flex flex-col gap-3 p-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-small font-semibold">Filtrar por data</h2>
            <button
              type="button"
              onClick={clearFilter}
              className="text-mini font-semibold text-primary hover:underline"
            >
              Limpar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <DateInput
              label="Data inicial"
              value={draft.from}
              max={draft.to}
              onChange={(from) => setDraft((current) => ({ ...current, from }))}
            />
            <DateInput
              label="Data final"
              value={draft.to}
              max={todayIso()}
              onChange={(to) => setDraft((current) => ({ ...current, to }))}
            />
          </div>
          <Button disabled={isInvalidPeriod} onClick={() => setPeriod(draft)}>
            Aplicar filtro
          </Button>
        </Card>

        <Card className="flex flex-col gap-2.5 p-3.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <p className="text-nav text-muted">Comprado no período</p>
              <p className="text-section font-bold">
                {formatCents(statement.data?.period.purchasedCents ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-nav text-muted">Pago no período</p>
              <p className="text-section font-bold">{formatCents(statement.data?.period.paidCents ?? 0)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-2.5">
            <span className="text-caption font-semibold">Saldo atual do cliente</span>
            <CurrentBalance balance={balance} />
          </div>
        </Card>

        <section aria-labelledby="entries-title" className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-nav text-muted">
            <span className="text-caption font-semibold text-ink">
              {formatDayMonth(period.from)} – {formatLongDate(period.to)}
            </span>
            <span>Período aplicado</span>
          </div>
          <div className="flex items-center justify-between">
            <h2 id="entries-title" className="text-small font-semibold">
              Compras e pagamentos
            </h2>
            <span className="text-nav text-muted">
              {statement.data?.total ?? 0} {statement.data?.total === 1 ? "registro" : "registros"}
            </span>
          </div>

          {statement.error ? (
            <ErrorState message={statement.error.message} onRetry={statement.reload} />
          ) : statement.isLoading && !statement.data ? (
            <LoadingState label="Carregando lançamentos" />
          ) : entries.length === 0 ? (
            <Card>
              <EmptyState title="Nenhum lançamento neste período" />
            </Card>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
          {statement.data && statement.data.total > entries.length && (
            <p className="text-center text-caption text-muted">
              Mostrando os {entries.length} mais recentes. Reduza o período para ver os demais.
            </p>
          )}
        </section>

        {/* O envio por WhatsApp é de uma etapa futura; por enquanto, o botão fica sem ação. */}
        <Button aria-label="Enviar extrato (em breve)">
          <Send className="size-4.5" strokeWidth={1.5} aria-hidden />
          Enviar extrato
        </Button>
        {balance.availableCreditCents > 0 && (
          <Button variant="outline" onClick={() => navigate(`/clientes/${id}/devolver-credito`)}>
            <HandCoins className="size-4.5" strokeWidth={1.5} aria-hidden />
            Devolver crédito
          </Button>
        )}
      </div>
    </PageContainer>
  )
}
