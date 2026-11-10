import { api } from "../../lib/api"
import type { Canteen } from "./types"

export async function fetchCanteens() {
  const { data } = await api.get<{ canteens: Canteen[] }>("/canteens")
  return data.canteens
}

export async function createCanteen(name: string) {
  const { data } = await api.post<{ canteen: Canteen }>("/canteens", { name })
  return data.canteen
}

export async function updateCanteen(id: string, input: { name?: string; isActive?: boolean }) {
  const { data } = await api.patch<{ canteen: Canteen }>(`/canteens/${id}`, input)
  return data.canteen
}
