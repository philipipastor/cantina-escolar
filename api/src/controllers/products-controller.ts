import type { Request, Response } from "express"
import { prisma } from "../prisma"
import { createProductSchema, listProductsSchema, updateProductSchema } from "../schemas/products-schema"
import { idParamsSchema, toLikeTerm } from "../schemas/shared-schema"
import { AppError } from "../utils/AppError"

// Janela usada para colocar os produtos mais vendidos no topo da lista.
const BEST_SELLERS_DAYS = 30

export class ProductsController {
  // Lista com os mais vendidos primeiro, desconsiderando vendas estornadas.
  async index(request: Request, response: Response) {
    const { search, active } = listProductsSchema.parse(request.query)
    const term = toLikeTerm(search)

    const rows = await prisma.$queryRaw<
      { id: string; name: string; priceCents: number; isActive: boolean; recentlySold: bigint }[]
    >`
      SELECT p."id", p."name", p."priceCents", p."isActive",
             COALESCE((
               SELECT SUM(i."quantity")
               FROM "PurchaseItem" i
               JOIN "Entry" e ON e."id" = i."entryId"
               WHERE i."productId" = p."id"
                 AND e."recordedAt" >= now() - make_interval(days => ${BEST_SELLERS_DAYS}::int)
                 AND NOT EXISTS (SELECT 1 FROM "Entry" r WHERE r."reversesId" = e."id")
             ), 0)::bigint AS "recentlySold"
      FROM "Product" p
      WHERE p."canteenId" = ${request.params.canteenId}
        AND p."isActive" = ${active}
        AND unaccent(p."name") ILIKE unaccent(${term}::text)
      ORDER BY "recentlySold" DESC, lower(unaccent(p."name")), p."id"`

    return response.json({
      products: rows.map((row) => ({ ...row, recentlySold: Number(row.recentlySold) })),
    })
  }

  async create(request: Request, response: Response) {
    const data = createProductSchema.parse(request.body)
    const product = await prisma.product.create({ data: { ...data, canteenId: request.params.canteenId } })
    return response.status(201).json({ product })
  }

  // Mudar o preço não afeta compras antigas: cada item guarda o preço praticado.
  async update(request: Request, response: Response) {
    const { id } = idParamsSchema.parse(request.params)
    const data = updateProductSchema.parse(request.body)

    const existing = await prisma.product.findFirst({ where: { id, canteenId: request.params.canteenId } })
    if (!existing) throw new AppError("Produto não encontrado", 404)

    const product = await prisma.product.update({ where: { id }, data })
    return response.json({ product })
  }
}
