import { api } from "../../lib/api"
import type { DailyReview } from "./types"

export async function fetchDailyReview(canteenId: string, date: string) {
  const { data } = await api.get<DailyReview>(`/canteens/${canteenId}/daily-review`, { params: { date } })
  return data
}
