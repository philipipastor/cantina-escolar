import { useCallback, useState } from "react"
import { Avatar } from "../../../components/ui/Avatar"
import { BottomSheet } from "../../../components/ui/BottomSheet"
import { SearchInput } from "../../../components/ui/SearchInput"
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States"
import { useApiData } from "../../../hooks/useApiData"
import { useDebouncedValue } from "../../../hooks/useDebouncedValue"
import { joinNames } from "../../../lib/text"
import { fetchClients } from "../api"
import type { Client } from "../types"
import { BalanceSummary } from "./BalanceValue"

type ClientPickerSheetProps = {
  canteenId: string
  onSelect: (client: Client) => void
  onClose: () => void
}

export function ClientPickerSheet({ canteenId, onSelect, onClose }: ClientPickerSheetProps) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search.trim())
  const load = useCallback(
    () => fetchClients(canteenId, { search: debouncedSearch, status: "ALL" }),
    [canteenId, debouncedSearch],
  )
  const { data, error, isLoading, reload } = useApiData(load)

  return (
    <BottomSheet title="Selecionar cliente" onClose={onClose}>
      <SearchInput
        autoFocus
        aria-label="Buscar cliente"
        placeholder="Buscar por nome, telefone ou filho"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="min-h-40 overflow-y-auto">
        {error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : isLoading && !data ? (
          <LoadingState label="Carregando clientes" />
        ) : data?.clients.length === 0 ? (
          <EmptyState title="Nenhum cliente encontrado" description="Tente outra busca." />
        ) : (
          <ul className="divide-y divide-line">
            {data?.clients.map((client) => {
              const children = client.children.filter((child) => child.isActive).map((child) => child.name)
              return (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(client)}
                    className="flex w-full items-center gap-3 py-2.5 text-left transition hover:bg-page"
                  >
                    <Avatar name={client.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-small font-semibold">{client.name}</span>
                      {children.length > 0 && (
                        <span className="block truncate text-nav text-muted">{joinNames(children)}</span>
                      )}
                      <BalanceSummary balance={client.balance} />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </BottomSheet>
  )
}
