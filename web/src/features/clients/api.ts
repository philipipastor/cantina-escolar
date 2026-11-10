import { api } from "../../lib/api"
import type { Child, Client, ClientInput, ClientListItem, ClientStatusFilter, Statement } from "./types"

const clientsUrl = (canteenId: string) => `/canteens/${canteenId}/clients`

export async function fetchClients(
  canteenId: string,
  filters: { search: string; status: ClientStatusFilter },
) {
  const { data } = await api.get<{ clients: ClientListItem[]; total: number }>(clientsUrl(canteenId), {
    params: {
      search: filters.search || undefined,
      status: filters.status === "DEBT" || filters.status === "CREDIT" ? filters.status : undefined,
      active: filters.status === "INACTIVE" ? "false" : undefined,
      perPage: 100,
    },
  })
  return data
}

export async function fetchClient(canteenId: string, id: string) {
  const { data } = await api.get<{ client: Client }>(`${clientsUrl(canteenId)}/${id}`)
  return data.client
}

export async function createClient(canteenId: string, input: ClientInput & { children: { name: string }[] }) {
  const { data } = await api.post<{ client: Client }>(clientsUrl(canteenId), input)
  return data.client
}

export async function updateClient(
  canteenId: string,
  id: string,
  input: Partial<ClientInput> & { isActive?: boolean },
) {
  const { data } = await api.patch<{ client: Client }>(`${clientsUrl(canteenId)}/${id}`, input)
  return data.client
}

export async function createChild(canteenId: string, clientId: string, name: string) {
  const { data } = await api.post<{ child: Child }>(`${clientsUrl(canteenId)}/${clientId}/children`, { name })
  return data.child
}

export async function updateChild(
  canteenId: string,
  clientId: string,
  childId: string,
  input: { isActive: boolean },
) {
  const { data } = await api.patch<{ child: Child }>(
    `${clientsUrl(canteenId)}/${clientId}/children/${childId}`,
    input,
  )
  return data.child
}

export async function fetchStatement(canteenId: string, clientId: string, from: string, to: string) {
  const { data } = await api.get<Statement>(`${clientsUrl(canteenId)}/${clientId}/statement`, {
    params: { from, to, perPage: 200 },
  })
  return data
}

// Dívida ou crédito que o cliente já tinha antes de usar o sistema.
export async function createOpeningBalance(
  canteenId: string,
  input: { clientId: string; nature: "DEBT" | "CREDIT"; amountCents: number; idempotencyKey: string },
) {
  await api.post(`/canteens/${canteenId}/opening-balances`, {
    ...input,
    description: "Saldo anterior ao sistema",
  })
}

export type CanteenSummary = {
  receivableCents: number
  debtorAccounts: number
  availableCreditCents: number
  creditAccounts: number
}

export async function fetchCanteenSummary(canteenId: string) {
  const { data } = await api.get<{ summary: CanteenSummary }>(`/canteens/${canteenId}/dashboard`)
  return data.summary
}
