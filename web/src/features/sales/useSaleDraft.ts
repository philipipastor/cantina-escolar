import { useMemo, useState } from "react"
import { todayIso } from "../../lib/dates"
import type { Client } from "../clients/types"
import type { Product } from "../products/types"
import { ACCOUNT_HOLDER, consumerOptions, toPurchaseConsumer, type ConsumerChoice } from "./consumer"
import type { Entry, PurchaseInput, SaleItem } from "./types"

export type SaleDraftInitial = { client?: Client; redoing?: Entry }

// Sem filhos ativos, quem compra é o próprio responsável. Com filhos, a pessoa precisa escolher.
function defaultConsumer(client: Client) {
  return client.children.some((child) => child.isActive) ? null : ACCOUNT_HOLDER
}

function consumerFromEntry(entry: Entry): ConsumerChoice | null {
  if (!entry.consumer) return null
  return entry.consumer.type === "CHILD" ? (entry.consumer.child?.id ?? null) : entry.consumer.type
}

function itemsFromEntry(entry: Entry): SaleItem[] {
  return entry.items.map((item) => ({
    productId: item.productId,
    name: item.description,
    unitPriceCents: item.unitPriceCents,
    quantity: item.quantity,
  }))
}

// Guarda a venda em andamento e suas regras, para os componentes visuais só mostrarem o resultado.
export function useSaleDraft({ client: initialClient, redoing }: SaleDraftInitial) {
  const [client, setClient] = useState<Client | null>(initialClient ?? null)
  const [consumer, setConsumer] = useState<ConsumerChoice | null>(() => {
    if (redoing) return consumerFromEntry(redoing)
    return initialClient ? defaultConsumer(initialClient) : null
  })
  const [items, setItems] = useState<SaleItem[]>(() => (redoing ? itemsFromEntry(redoing) : []))
  const [date, setDate] = useState(() => redoing?.referenceDate ?? todayIso())

  const keptChildId = redoing?.consumer?.child?.id
  const options = useMemo(() => (client ? consumerOptions(client, keptChildId) : []), [client, keptChildId])
  const totalCents = items.reduce((total, item) => total + item.quantity * item.unitPriceCents, 0)
  const units = items.reduce((total, item) => total + item.quantity, 0)

  function selectClient(selected: Client) {
    setClient(selected)
    setConsumer(defaultConsumer(selected))
  }

  function addProduct(product: Product) {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id)
      if (existing) {
        return current.map((item) => (item === existing ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          unitPriceCents: product.priceCents,
          quantity: 1,
        },
      ]
    })
  }

  function setQuantity(productId: string, quantity: number) {
    setItems((current) =>
      current.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
    )
  }

  function removeItem(productId: string) {
    setItems((current) => current.filter((item) => item.productId !== productId))
  }

  // Devolve o que falta preencher; a venda só segue com tudo vazio aqui.
  function validate() {
    return {
      client: client ? undefined : "Selecione o cliente",
      consumer: consumer ? undefined : "Informe quem consumiu",
      items: items.length > 0 ? undefined : "Adicione pelo menos um produto",
    }
  }

  function toPurchaseInput(): PurchaseInput | null {
    if (!client || !consumer || items.length === 0) return null
    return {
      clientId: client.id,
      consumer: toPurchaseConsumer(consumer),
      referenceDate: date,
      redoneFromId: redoing?.id,
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    }
  }

  return {
    client,
    consumer,
    items,
    date,
    options,
    totalCents,
    units,
    consumerLabel: options.find((option) => option.value === consumer)?.label ?? null,
    setClient,
    setConsumer,
    setDate,
    selectClient,
    addProduct,
    setQuantity,
    removeItem,
    validate,
    toPurchaseInput,
  }
}
