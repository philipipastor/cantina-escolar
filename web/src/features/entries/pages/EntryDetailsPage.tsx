import { useCallback } from "react"
import { Navigate, useParams } from "react-router"
import { ErrorState, LoadingState } from "../../../components/ui/States"
import { useApiData } from "../../../hooks/useApiData"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { MoneyEntryDetails } from "../../payments/components/MoneyEntryDetails"
import { fetchEntry } from "../../sales/api"
import { PurchaseDetails } from "../../sales/components/PurchaseDetails"

// Uma rota para todos os lançamentos: busca o lançamento e escolhe a tela pelo tipo.
export function EntryDetailsPage() {
  const canteen = useCurrentCanteen()
  const { id = "" } = useParams()
  const load = useCallback(() => fetchEntry(canteen.id, id), [canteen.id, id])
  const { data: entry, error, reload } = useApiData(load)

  if (error && !entry) return <ErrorState message={error.message} onRetry={reload} />
  if (!entry) return <LoadingState label="Carregando lançamento" />

  switch (entry.type) {
    case "PURCHASE":
      return <PurchaseDetails entry={entry} onReversed={reload} />
    case "PAYMENT":
    case "CREDIT_REFUND":
      return <MoneyEntryDetails entry={entry} onReversed={reload} />
    default:
      // Saldo anterior e estornos não têm tela própria: ficam só no extrato.
      return <Navigate to={`/clientes/${entry.client.id}`} replace />
  }
}
