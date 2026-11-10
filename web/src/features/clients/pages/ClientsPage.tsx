import { useCallback, useState } from "react"
import { UserRoundPlus } from "lucide-react"
import { useNavigate } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { FilterChips } from "../../../components/ui/FilterChips"
import { SearchInput } from "../../../components/ui/SearchInput"
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States"
import { useApiData } from "../../../hooks/useApiData"
import { useDebouncedValue } from "../../../hooks/useDebouncedValue"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { fetchClients } from "../api"
import { ClientRow } from "../components/ClientRow"
import { SummaryCards } from "../components/SummaryCards"
import type { ClientStatusFilter } from "../types"

export function ClientsPage() {
  const canteen = useCurrentCanteen()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<ClientStatusFilter>("ALL")
  const debouncedSearch = useDebouncedValue(search.trim())

  const load = useCallback(
    () => fetchClients(canteen.id, { search: debouncedSearch, status }),
    [canteen.id, debouncedSearch, status],
  )
  const { data, error, isLoading, reload } = useApiData(load)

  const filters: { value: ClientStatusFilter; label: string }[] = [
    { value: "ALL", label: status === "ALL" && data ? `Todos (${data.total})` : "Todos" },
    { value: "DEBT", label: "A receber" },
    { value: "CREDIT", label: "Com crédito" },
    { value: "INACTIVE", label: "Inativos" },
  ]
  const clients = data?.clients ?? []
  const hasFilter = debouncedSearch !== "" || status !== "ALL"

  return (
    <PageContainer>
      <PageHeader title="Seus clientes" subtitle="Cada conta em dia. Cada cliente por perto." />
      <div className="flex flex-col gap-3.5 px-5">
        <SummaryCards canteenId={canteen.id} />
        <SearchInput
          aria-label="Buscar cliente"
          placeholder="Buscar por nome, telefone ou filho"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <FilterChips label="Filtrar clientes" options={filters} value={status} onChange={setStatus} />

        <section aria-labelledby="clients-title" className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 id="clients-title" className="text-small font-semibold">
              Clientes cadastrados
            </h2>
            {data && <span className="text-mini font-semibold text-primary">{data.total} no total</span>}
          </div>

          {error ? (
            <ErrorState message={error.message} onRetry={reload} />
          ) : isLoading && !data ? (
            <LoadingState label="Carregando clientes" />
          ) : clients.length === 0 ? (
            <Card>
              <EmptyState
                title={hasFilter ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                description={
                  hasFilter ? "Tente outra busca ou filtro." : "Cadastre o primeiro cliente abaixo."
                }
              />
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <ul className="divide-y divide-line">
                {clients.map((client) => (
                  <ClientRow key={client.id} client={client} />
                ))}
              </ul>
            </Card>
          )}
          {data && data.total > clients.length && (
            <p className="text-center text-caption text-muted">
              Mostrando {clients.length} de {data.total}. Use a busca para encontrar os demais.
            </p>
          )}
        </section>

        <Button onClick={() => navigate("/clientes/novo")}>
          <UserRoundPlus className="size-4.5" strokeWidth={1.5} aria-hidden />
          Cadastrar cliente
        </Button>
      </div>
    </PageContainer>
  )
}
