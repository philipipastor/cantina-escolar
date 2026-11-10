import { api } from "../../lib/api"
import type { MoneyEntryInput, MoneyEntryResult } from "./types"

type WithKey = MoneyEntryInput & { idempotencyKey: string }

export async function createPayment(canteenId: string, input: WithKey) {
  const { data } = await api.post<MoneyEntryResult>(`/canteens/${canteenId}/payments`, input)
  return data
}

export async function createCreditRefund(canteenId: string, input: WithKey) {
  const { data } = await api.post<MoneyEntryResult>(`/canteens/${canteenId}/credit-refunds`, input)
  return data
}
