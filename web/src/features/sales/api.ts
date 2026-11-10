import { api } from "../../lib/api"
import type { Entry, PurchaseInput, PurchaseResult } from "./types"

const canteenUrl = (canteenId: string) => `/canteens/${canteenId}`

export async function createPurchase(
  canteenId: string,
  input: PurchaseInput & {
    idempotencyKey: string
    // Saldo que a pessoa viu na tela. Se mudou, a API avisa em vez de salvar.
    expectedBalanceCents: number
    confirmDuplicate: boolean
  },
) {
  const { data } = await api.post<PurchaseResult>(`${canteenUrl(canteenId)}/purchases`, input)
  return data
}

export async function fetchEntry(canteenId: string, id: string) {
  const { data } = await api.get<{ entry: Entry }>(`${canteenUrl(canteenId)}/entries/${id}`)
  return data.entry
}

export async function reverseEntry(
  canteenId: string,
  id: string,
  input: { reason: string; idempotencyKey: string },
) {
  await api.post(`${canteenUrl(canteenId)}/entries/${id}/reversal`, input)
}
