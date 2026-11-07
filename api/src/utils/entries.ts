import { createHash } from "node:crypto"
import { Prisma } from "@prisma/client"
import type { EntryType } from "@prisma/client"
import { prisma } from "../prisma"
import { AppError } from "./AppError"
import { describeBalance } from "./balance"
import { entryInclude, presentEntry, type EntryWithDetails } from "./presenters"

export type Database = Prisma.TransactionClient

export async function getAccountBalance(db: Database, clientId: string) {
  const { _sum } = await db.entry.aggregate({ where: { clientId }, _sum: { amountCents: true } })
  return _sum.amountCents ?? 0
}

// Trava a conta até o fim da transação: operações da mesma conta acontecem em fila.
async function lockClient(db: Database, canteenId: string, clientId: string) {
  const [client] = await db.$queryRaw<{ id: string; isActive: boolean }[]>`
    SELECT "id", "isActive" FROM "Client"
    WHERE "id" = ${clientId} AND "canteenId" = ${canteenId}
    FOR UPDATE`
  if (!client) throw new AppError("Cliente não encontrado", 404)
  return client
}

type Operation<Effect> = (args: {
  tx: Database
  balanceCents: number
  client: { id: string; isActive: boolean }
  requestHash: string
}) => Promise<{ entryId: string; effect: Effect }>

/**
 * Executa uma operação financeira em transação, com a conta travada. Se a mesma chave chegar de
 * novo (nova tentativa após falha de conexão), devolve o lançamento original sem duplicá-lo.
 */
export async function runEntryOperation<Effect>(
  canteenId: string,
  clientId: string,
  idempotencyKey: string,
  hashedData: unknown,
  operation: Operation<Effect>,
) {
  const requestHash = createHash("sha256").update(JSON.stringify(hashedData)).digest("hex")
  const where = { canteenId_idempotencyKey: { canteenId, idempotencyKey } }

  async function replay(db: Database, existing: EntryWithDetails) {
    if (existing.requestHash !== requestHash) {
      throw new AppError(
        "Esta chave de operação já foi usada em um lançamento com outros dados",
        409,
        "IDEMPOTENCY_KEY_REUSED",
      )
    }
    return {
      entry: presentEntry(existing),
      effect: null,
      balance: describeBalance(await getAccountBalance(db, existing.clientId)),
      repeated: true,
    }
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const client = await lockClient(tx, canteenId, clientId)

        const existing = await tx.entry.findUnique({ where, include: entryInclude })
        if (existing) return await replay(tx, existing)

        const balanceCents = await getAccountBalance(tx, clientId)
        const { entryId, effect } = await operation({ tx, balanceCents, client, requestHash })
        const entry = await tx.entry.findUniqueOrThrow({ where: { id: entryId }, include: entryInclude })

        return {
          entry: presentEntry(entry),
          effect,
          balance: describeBalance(await getAccountBalance(tx, clientId)),
          repeated: false,
        }
      },
      { maxWait: 10000, timeout: 15000 },
    )
  } catch (error) {
    // A mesma chave pode ter sido usada ao mesmo tempo em outra conta, que não estava travada.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.entry.findUnique({ where, include: entryInclude })
      if (existing) return await replay(prisma, existing)
    }
    throw error
  }
}

// Confere se um lançamento pode ser refeito e o devolve para reaproveitar seus dados.
export async function findEntryToRedo(
  db: Database,
  canteenId: string,
  redoneFromId: string,
  type: EntryType,
) {
  const original = await db.entry.findFirst({
    where: { id: redoneFromId, canteenId },
    include: { reversedBy: { select: { id: true } }, redoneAs: { select: { id: true } }, items: true },
  })
  if (!original) throw new AppError("Lançamento a refazer não encontrado", 404)
  if (original.type !== type) {
    throw new AppError("O lançamento refeito deve ser do mesmo tipo", 400, "REDO_TYPE_MISMATCH")
  }
  if (!original.reversedBy) {
    throw new AppError("Estorne o lançamento antes de refazê-lo", 400, "REDO_WITHOUT_REVERSAL")
  }
  if (original.redoneAs) throw new AppError("Este lançamento já foi refeito", 409, "ALREADY_REDONE")
  return original
}
