import { useCallback, useMemo, useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { FilterChips } from "../../../components/ui/FilterChips"
import { SearchInput } from "../../../components/ui/SearchInput"
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States"
import { useApiData } from "../../../hooks/useApiData"
import { formatCents } from "../../../lib/money"
import { matchesSearch } from "../../../lib/text"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { fetchProducts } from "../api"
import { ProductThumb } from "../components/ProductThumb"

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE"

const filters: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "ACTIVE", label: "Ativos" },
  { value: "INACTIVE", label: "Inativos" },
]

export function ProductsPage() {
  const canteen = useCurrentCanteen()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("ALL")

  // O catálogo de uma cantina é pequeno: busca uma vez e filtra aqui, sem nova consulta a cada letra.
  const load = useCallback(() => fetchProducts(canteen.id, "all"), [canteen.id])
  const { data, error, isLoading, reload } = useApiData(load)

  const products = useMemo(
    () =>
      (data ?? [])
        .filter((product) => status === "ALL" || product.isActive === (status === "ACTIVE"))
        .filter((product) => matchesSearch(product.name, search))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [data, search, status],
  )
  const total = data?.length ?? 0

  return (
    <PageContainer>
      <PageHeader title="Seus produtos" subtitle="Preços organizados. Vendas mais rápidas." />
      <div className="flex flex-col gap-3.5 px-5">
        <Card className="flex flex-col gap-1.5 p-3.5">
          <p className="text-nav text-muted">No catálogo</p>
          <p className="text-stat font-bold">
            {total} {total === 1 ? "produto" : "produtos"}
          </p>
        </Card>
        <SearchInput
          aria-label="Buscar produto"
          placeholder="Buscar produto"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <FilterChips label="Filtrar produtos" options={filters} value={status} onChange={setStatus} />

        <section aria-labelledby="products-title" className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 id="products-title" className="text-small font-semibold">
              Catálogo de produtos
            </h2>
            <span className="text-mini font-semibold text-primary">Nome A–Z</span>
          </div>

          {error ? (
            <ErrorState message={error.message} onRetry={reload} />
          ) : isLoading && !data ? (
            <LoadingState label="Carregando produtos" />
          ) : products.length === 0 ? (
            <Card>
              <EmptyState
                title={total === 0 ? "Nenhum produto cadastrado" : "Nenhum produto encontrado"}
                description={
                  total === 0 ? "Cadastre o primeiro produto abaixo." : "Tente outra busca ou filtro."
                }
              />
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <ul className="divide-y divide-line">
                {products.map((product) => (
                  <li key={product.id}>
                    <Link
                      to={`/produtos/${product.id}/editar`}
                      className="flex items-center gap-3 px-3.5 py-3 transition hover:bg-page focus-visible:bg-page focus-visible:outline-none"
                    >
                      <ProductThumb />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-small font-semibold">{product.name}</p>
                        <p className={product.isActive ? "text-nav text-success" : "text-nav text-primary"}>
                          {product.isActive ? "Ativo" : "Inativo"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-small font-bold">{formatCents(product.priceCents)}</span>
                        <Pencil className="size-3.5 text-muted" strokeWidth={1.5} aria-label="Editar" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>

        <Button onClick={() => navigate("/produtos/novo")}>
          <Plus className="size-4.5" strokeWidth={1.5} aria-hidden />
          Cadastrar produto
        </Button>
      </div>
    </PageContainer>
  )
}
