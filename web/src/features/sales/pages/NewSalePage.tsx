import { useCallback } from "react"
import { useSearchParams } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { ErrorState, LoadingState } from "../../../components/ui/States"
import { useApiData } from "../../../hooks/useApiData"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { fetchClient } from "../../clients/api"
import { fetchEntry } from "../api"
import { SaleForm } from "../components/SaleForm"
import type { SaleDraftInitial } from "../useSaleDraft"

/**
 * A venda pode começar vazia, com um cliente recém-cadastrado (?cliente=id) ou refazendo uma venda
 * estornada (?refazer=id). Esta página busca esses dados; o formulário só abre com eles em mãos.
 */
export function NewSalePage() {
  const canteen = useCurrentCanteen()
  const [params] = useSearchParams()
  const clientId = params.get("cliente")
  const redoId = params.get("refazer")

  const load = useCallback(async (): Promise<SaleDraftInitial> => {
    if (redoId) {
      const redoing = await fetchEntry(canteen.id, redoId)
      return { redoing, client: await fetchClient(canteen.id, redoing.client.id) }
    }
    return clientId ? { client: await fetchClient(canteen.id, clientId) } : {}
  }, [canteen.id, clientId, redoId])
  const { data, error, reload } = useApiData(load)

  return (
    <PageContainer>
      <PageHeader title="Nova Venda" subtitle="Venda agora. Receba com tudo organizado." />
      {error && !data ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : !data ? (
        <LoadingState label="Carregando venda" />
      ) : (
        <SaleForm key={`${clientId}-${redoId}`} initial={data} />
      )}
    </PageContainer>
  )
}
