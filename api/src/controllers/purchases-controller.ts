import type { Request, Response } from "express"
import { prisma } from "../prisma"
import {
  createPurchaseSchema,
  purchasePreviewSchema,
  type PurchasePreviewInput,
} from "../schemas/entries-schema"
import { MAX_AMOUNT_CENTS } from "../schemas/shared-schema"
import { AppError } from "../utils/AppError"
import { getPurchaseEffect } from "../utils/balance"
import { today, toDatabaseDate } from "../utils/dates"
import { findEntryToRedo, runEntryOperation, type Database } from "../utils/entries"

// Monta os itens com os preços do servidor; nunca confia em preço de produto vindo do cliente.
async function buildItems(db: Database, canteenId: string, { items, redoneFromId }: PurchasePreviewInput) {
  const original = redoneFromId ? await findEntryToRedo(db, canteenId, redoneFromId, "PURCHASE") : null

  const productIds = items.map((item) => item.productId)
  const products = await db.product.findMany({ where: { id: { in: productIds }, canteenId } })
  const productsById = new Map(products.map((product) => [product.id, product]))

  const builtItems = items.map((item) => {
    const product = productsById.get(item.productId)
    if (!product) throw new AppError("Produto não encontrado", 404)

    // Ao refazer, vale o preço praticado na venda original, não o preço atual do produto.
    const originalItem = original?.items.find(({ productId }) => productId === item.productId)
    if (!product.isActive && !originalItem) {
      throw new AppError(`O produto "${product.name}" está inativo`, 400, "INACTIVE_PRODUCT")
    }
    return {
      productId: product.id,
      description: originalItem?.description ?? product.name,
      quantity: item.quantity,
      unitPriceCents: originalItem?.unitPriceCents ?? product.priceCents,
    }
  })

  const totalCents = builtItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0)
  if (totalCents > MAX_AMOUNT_CENTS) {
    throw new AppError("O total da compra está acima do limite permitido", 400, "AMOUNT_ABOVE_LIMIT")
  }
  return { items: builtItems, totalCents }
}

// O filho precisa ser da conta e estar ativo, salvo ao refazer uma compra antiga.
async function ensureValidConsumer(
  db: Database,
  { clientId, consumer, redoneFromId }: Pick<PurchasePreviewInput, "clientId" | "consumer" | "redoneFromId">,
) {
  if (consumer.type !== "CHILD") return
  const child = await db.child.findFirst({ where: { id: consumer.childId, clientId } })
  if (!child) throw new AppError("Filho não encontrado", 404)
  if (!child.isActive && !redoneFromId) {
    throw new AppError(`"${child.name}" está inativo nesta conta`, 400, "INACTIVE_CHILD")
  }
}

function findSamePurchase(
  db: Database,
  canteenId: string,
  clientId: string,
  referenceDate: string,
  totalCents: number,
) {
  return db.entry.findFirst({
    where: {
      canteenId,
      clientId,
      type: "PURCHASE",
      referenceDate: toDatabaseDate(referenceDate),
      amountCents: -totalCents,
      reversedBy: null,
    },
    select: { id: true, recordedAt: true },
    orderBy: { recordedAt: "desc" },
  })
}

function inactiveClientError() {
  return new AppError("Esta conta está inativa. Reative-a para lançar compras.", 400, "INACTIVE_CLIENT")
}

export class PurchasesController {
  // Calcula o efeito da compra sem salvar nada, para exibir antes da confirmação.
  async preview(request: Request, response: Response) {
    const { canteenId } = request.params
    const data = purchasePreviewSchema.parse(request.body)

    const client = await prisma.client.findFirst({ where: { id: data.clientId, canteenId } })
    if (!client) throw new AppError("Cliente não encontrado", 404)
    if (!client.isActive) throw inactiveClientError()

    await ensureValidConsumer(prisma, data)
    const { items, totalCents } = await buildItems(prisma, canteenId, data)
    const { _sum } = await prisma.entry.aggregate({
      where: { clientId: data.clientId },
      _sum: { amountCents: true },
    })

    return response.json({
      items: items.map((item) => ({ ...item, subtotalCents: item.quantity * item.unitPriceCents })),
      effect: getPurchaseEffect(_sum.amountCents ?? 0, totalCents),
      referenceDate: data.referenceDate,
      isDateDifferentFromToday: data.referenceDate !== today(),
      possibleDuplicate: await findSamePurchase(
        prisma,
        canteenId,
        data.clientId,
        data.referenceDate,
        totalCents,
      ),
    })
  }

  async create(request: Request, response: Response) {
    const { canteenId } = request.params
    const { idempotencyKey, expectedBalanceCents, confirmDuplicate, ...data } = createPurchaseSchema.parse(
      request.body,
    )

    const result = await runEntryOperation(
      canteenId,
      data.clientId,
      idempotencyKey,
      data,
      async ({ tx, balanceCents, client, requestHash }) => {
        if (!client.isActive) throw inactiveClientError()

        await ensureValidConsumer(tx, data)
        const { items, totalCents } = await buildItems(tx, canteenId, data)
        const effect = getPurchaseEffect(balanceCents, totalCents)

        // O saldo pode ter mudado desde a prévia, por exemplo com outro funcionário lançando.
        if (expectedBalanceCents !== undefined && expectedBalanceCents !== balanceCents) {
          throw new AppError(
            "O saldo da conta mudou desde a prévia. Confira o novo resultado antes de confirmar.",
            409,
            "BALANCE_CHANGED",
            { effect },
          )
        }

        if (!confirmDuplicate) {
          const samePurchase = await findSamePurchase(
            tx,
            canteenId,
            data.clientId,
            data.referenceDate,
            totalCents,
          )
          if (samePurchase) {
            throw new AppError(
              "Já existe uma compra igual nesta conta e nesta data. Deseja lançar mesmo assim?",
              409,
              "POSSIBLE_DUPLICATE",
              { existingPurchase: samePurchase },
            )
          }
        }

        const entry = await tx.entry.create({
          data: {
            canteenId,
            clientId: data.clientId,
            userId: request.user!.id,
            type: "PURCHASE",
            amountCents: -totalCents,
            referenceDate: toDatabaseDate(data.referenceDate),
            consumerType: data.consumer.type,
            childId: data.consumer.type === "CHILD" ? data.consumer.childId : null,
            redoneFromId: data.redoneFromId ?? null,
            idempotencyKey,
            requestHash,
            // A cantina dos itens vem do próprio lançamento.
            items: { create: items },
          },
        })
        return { entryId: entry.id, effect }
      },
    )

    return response.status(result.repeated ? 200 : 201).json(result)
  }
}
