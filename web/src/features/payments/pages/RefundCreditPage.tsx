import { useCallback } from "react"
import { Navigate, useParams, useSearchParams } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { ErrorState, LoadingState } from "../../../components/ui/States"
import { useApiData } from "../../../hooks/useApiData"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { fetchClient } from "../../clients/api"
import { fetchEntry } from "../../sales/api"
import { RefundForm } from "../components/RefundForm"

// A devolução pode refazer uma devolução estornada (?refazer=id), vindo já preenchida.
export function RefundCreditPage() {
  const canteen = useCurrentCanteen()
  const { id = "" } = useParams()
  const [params] = useSearchParams()
  const redoId = params.get("refazer")
  const load = useCallback(async () => {
    const [client, redoing] = await Promise.all([
      fetchClient(canteen.id, id),
      redoId ? fetchEntry(canteen.id, redoId) : undefined,
    ])
    return { client, redoing }
  }, [canteen.id, id, redoId])
  const { data, error, reload } = useApiData(load)

  if (error && !data) return <ErrorState message={error.message} onRetry={reload} />
  if (!data) return <LoadingState label="Carregando cliente" />
  // Sem crédito, não há o que devolver: volta para o relatório do cliente.
  if (data.client.balance.availableCreditCents === 0) return <Navigate to={`/clientes/${id}`} replace />

  return (
    <PageContainer>
      <PageHeader title="Devolver crédito" subtitle="Devolva o crédito disponível do cliente." />
      <RefundForm client={data.client} redoing={data.redoing} onCreditChanged={reload} />
    </PageContainer>
  )
}
