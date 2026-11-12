import { useCallback } from "react"
import { useApiData } from "../../hooks/useApiData"
import { useCurrentCanteen } from "../canteens/CanteenContext"
import type { Entry } from "../sales/types"
import { fetchClient } from "./api"

// Telefone e saldo atual do cliente de um lançamento, para o comprovante nas telas de detalhes.
// Carregados ao abrir a tela, para o WhatsApp abrir logo no toque (o celular bloqueia se houver espera),
// e de novo após um estorno, que muda o saldo.
export function useReceiptClient(entry: Pick<Entry, "client" | "isReversed">) {
  const canteen = useCurrentCanteen()
  const load = useCallback(
    () => fetchClient(canteen.id, entry.client.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- entry.isReversed só dispara a nova busca.
    [canteen.id, entry.client.id, entry.isReversed],
  )
  const client = useApiData(load)
  return {
    client: client.data,
    isLoading: client.isLoading && !client.data,
    loadFailed: !!client.error && !client.data,
  }
}
