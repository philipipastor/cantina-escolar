import { Prisma } from "@prisma/client"
import { describeBalance } from "./balance"
import { formatDate } from "./dates"

const personSelect = { select: { id: true, name: true } } as const

export const userSelect = {
  id: true,
  username: true,
  name: true,
  role: true,
  canteenId: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.UserSelect

export const entryInclude = {
  client: personSelect,
  child: personSelect,
  user: personSelect,
  items: true,
  reverses: { select: { id: true, type: true, amountCents: true, referenceDate: true } },
  reversedBy: { select: { id: true, recordedAt: true, reason: true, user: personSelect } },
  redoneFrom: { select: { id: true } },
  redoneAs: { select: { id: true } },
} satisfies Prisma.EntryInclude

export type EntryWithDetails = Prisma.EntryGetPayload<{ include: typeof entryInclude }>

export function presentEntry(entry: EntryWithDetails) {
  return {
    id: entry.id,
    canteenId: entry.canteenId,
    type: entry.type,
    amountCents: entry.amountCents,
    referenceDate: formatDate(entry.referenceDate),
    recordedAt: entry.recordedAt,
    client: entry.client,
    recordedBy: entry.user,
    paymentMethod: entry.paymentMethod,
    consumer: entry.consumerType ? { type: entry.consumerType, child: entry.child } : null,
    description: entry.description,
    reason: entry.reason,
    items: entry.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      isCustom: item.productId === null,
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      subtotalCents: item.quantity * item.unitPriceCents,
    })),
    isReversed: entry.reversedBy !== null,
    reversedBy: entry.reversedBy,
    reverses: entry.reverses && {
      ...entry.reverses,
      referenceDate: formatDate(entry.reverses.referenceDate),
    },
    redoneFromId: entry.redoneFrom?.id ?? null,
    redoneAsId: entry.redoneAs?.id ?? null,
  }
}

export function presentClient<T extends object>(client: T, balanceCents: number) {
  return { ...client, balance: describeBalance(balanceCents) }
}
