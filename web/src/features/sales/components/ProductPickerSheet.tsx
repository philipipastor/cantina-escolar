import { useCallback, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { Link } from "react-router"
import { BottomSheet } from "../../../components/ui/BottomSheet"
import { SearchInput } from "../../../components/ui/SearchInput"
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States"
import { useApiData } from "../../../hooks/useApiData"
import { formatCents } from "../../../lib/money"
import { matchesSearch } from "../../../lib/text"
import { fetchProducts } from "../../products/api"
import { ProductThumb } from "../../products/components/ProductThumb"
import type { Product } from "../../products/types"

type ProductPickerSheetProps = {
  canteenId: string
  onSelect: (product: Product) => void
  onClose: () => void
}

export function ProductPickerSheet({ canteenId, onSelect, onClose }: ProductPickerSheetProps) {
  const [search, setSearch] = useState("")
  const load = useCallback(() => fetchProducts(canteenId), [canteenId])
  const { data, error, isLoading, reload } = useApiData(load)
  const products = useMemo(
    () => (data ?? []).filter((product) => matchesSearch(product.name, search)),
    [data, search],
  )

  return (
    <BottomSheet title="Adicionar produto" onClose={onClose}>
      <SearchInput
        autoFocus
        aria-label="Buscar produto"
        placeholder="Buscar produto"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="min-h-40 overflow-y-auto">
        {error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : isLoading && !data ? (
          <LoadingState label="Carregando produtos" />
        ) : data?.length === 0 ? (
          <EmptyState
            title="Nenhum produto ativo"
            description="Cadastre produtos para registrar vendas."
            action={
              <Link to="/produtos/novo" className="text-small font-semibold text-primary hover:underline">
                Cadastrar produto
              </Link>
            }
          />
        ) : products.length === 0 ? (
          <EmptyState title="Nenhum produto encontrado" description="Tente outra busca." />
        ) : (
          <ul className="divide-y divide-line">
            {products.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => onSelect(product)}
                  className="flex w-full items-center gap-3 py-2.5 text-left transition hover:bg-page"
                >
                  <ProductThumb />
                  <span className="min-w-0 flex-1 truncate text-small font-semibold">{product.name}</span>
                  <span className="text-small font-bold">{formatCents(product.priceCents)}</span>
                  <Plus className="size-4 text-primary" strokeWidth={1.5} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </BottomSheet>
  )
}
