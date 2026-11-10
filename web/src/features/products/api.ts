import { api } from "../../lib/api"
import type { Product } from "./types"

const productsUrl = (canteenId: string) => `/canteens/${canteenId}/products`

// A API devolve os mais vendidos primeiro, o que deixa a busca da venda mais rápida.
export async function fetchProducts(canteenId: string, active: "true" | "all" = "true") {
  const { data } = await api.get<{ products: Product[] }>(productsUrl(canteenId), { params: { active } })
  return data.products
}

export async function fetchProduct(canteenId: string, id: string) {
  const { data } = await api.get<{ product: Product }>(`${productsUrl(canteenId)}/${id}`)
  return data.product
}

export async function createProduct(canteenId: string, input: { name: string; priceCents: number }) {
  const { data } = await api.post<{ product: Product }>(productsUrl(canteenId), input)
  return data.product
}

export async function updateProduct(
  canteenId: string,
  id: string,
  input: { name: string; priceCents: number; isActive: boolean },
) {
  const { data } = await api.patch<{ product: Product }>(`${productsUrl(canteenId)}/${id}`, input)
  return data.product
}
