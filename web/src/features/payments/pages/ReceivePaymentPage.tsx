import { useCallback } from "react"
import { useSearchParams } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { ErrorState, LoadingState } from "../../../components/ui/States"
import { useApiData } from "../../../hooks/useApiData"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { fetchClient } from "../../clients/api"
import { fetchEntry } from "../../sales/api"
import { PaymentForm, type PaymentFormInitial } from "../components/PaymentForm"

/**
 * O recebimento pode começar vazio ou refazendo um recebimento estornado (?refazer=id).
 * Esta página busca esses dados; o formulário só abre com eles em mãos.
 */
export function ReceivePaymentPage() {
  const canteen = useCurrentCanteen()
  const [params] = useSearchParams()
  const redoId = params.get("refazer")

  const load = useCallback(async (): Promise<PaymentFormInitial> => {
    if (!redoId) return {}
    const redoing = await fetchEntry(canteen.id, redoId)
    return { redoing, client: await fetchClient(canteen.id, redoing.client.id) }
  }, [canteen.id, redoId])
  const { data, error, reload } = useApiData(load)

  return (
    <PageContainer>
      <PageHeader title="Receber pagamento" subtitle="Dê baixa no fiado, total ou parcialmente." />
      {error && !data ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : !data ? (
        <LoadingState label="Carregando recebimento" />
      ) : (
        <PaymentForm key={redoId} initial={data} />
      )}
    </PageContainer>
  )
}
