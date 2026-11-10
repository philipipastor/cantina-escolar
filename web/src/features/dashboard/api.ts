import { api } from "../../lib/api"
import type { CanteenSummary } from "./types"

// Soma de todas as cantinas no período. Só o administrador pode pedir.
export async function fetchAllCanteensSummary(period: { from: string; to: string }) {
  const { data } = await api.get<{ totals: CanteenSummary }>("/dashboard", { params: period })
  return data.totals
}

// Sem período, a API resume o dia de hoje. As datas vão no formato "AAAA-MM-DD".
export async function fetchCanteenSummary(canteenId: string, period?: { from: string; to: string }) {
  const { data } = await api.get<{ summary: CanteenSummary }>(`/canteens/${canteenId}/dashboard`, {
    params: period,
  })
  return data.summary
}
