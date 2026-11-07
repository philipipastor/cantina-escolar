import type { Request, Response } from "express"
import { prisma } from "../prisma"
import {
  childParamsSchema,
  createChildSchema,
  createClientSchema,
  listClientsSchema,
  statementQuerySchema,
  updateChildSchema,
  updateClientSchema,
} from "../schemas/clients-schema"
import { idParamsSchema, toLikeTerm } from "../schemas/shared-schema"
import { AppError } from "../utils/AppError"
import { describeBalance } from "../utils/balance"
import { getAccountBalance } from "../utils/entries"
import { entryInclude, presentClient, presentEntry } from "../utils/presenters"

async function findClient(canteenId: string, id: string) {
  const client = await prisma.client.findFirst({
    where: { id, canteenId },
    include: { children: { orderBy: { name: "asc" } } },
  })
  if (!client) throw new AppError("Cliente não encontrado", 404)
  return client
}

export class ClientsController {
  // Busca a conta pelo nome do responsável ou de qualquer filho, sem diferenciar acentos.
  async index(request: Request, response: Response) {
    const { canteenId } = request.params
    const { search, active, page, perPage } = listClientsSchema.parse(request.query)
    const term = toLikeTerm(search)

    const rows = await prisma.$queryRaw<{ id: string; balance: bigint; total: bigint }[]>`
      SELECT c."id",
             COALESCE((SELECT SUM(e."amountCents") FROM "Entry" e WHERE e."clientId" = c."id"), 0)::bigint AS "balance",
             COUNT(*) OVER()::bigint AS "total"
      FROM "Client" c
      WHERE c."canteenId" = ${canteenId}
        AND c."isActive" = ${active}
        AND (
          unaccent(c."name") ILIKE unaccent(${term}::text)
          OR EXISTS (
            SELECT 1 FROM "Child" ch
            WHERE ch."clientId" = c."id" AND ch."isActive" AND unaccent(ch."name") ILIKE unaccent(${term}::text)
          )
        )
      ORDER BY lower(unaccent(c."name")), c."id"
      LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`

    const clients = await prisma.client.findMany({
      where: { id: { in: rows.map((row) => row.id) } },
      include: { children: { where: { isActive: true }, orderBy: { name: "asc" } } },
    })
    const clientsById = new Map(clients.map((client) => [client.id, client]))

    return response.json({
      clients: rows.map((row) => presentClient(clientsById.get(row.id)!, Number(row.balance))),
      total: Number(rows[0]?.total ?? 0),
      page,
      perPage,
    })
  }

  async create(request: Request, response: Response) {
    const { canteenId } = request.params
    const { children, name, phone, notes } = createClientSchema.parse(request.body)

    const client = await prisma.client.create({
      data: {
        canteenId,
        name,
        phone,
        notes,
        children: {
          create: children.map((child) => ({ name: child.name, canteen: { connect: { id: canteenId } } })),
        },
      },
      include: { children: { orderBy: { name: "asc" } } },
    })
    return response.status(201).json({ client: presentClient(client, 0) })
  }

  async show(request: Request, response: Response) {
    const { id } = idParamsSchema.parse(request.params)
    const client = await findClient(request.params.canteenId, id)
    return response.json({ client: presentClient(client, await getAccountBalance(prisma, id)) })
  }

  async update(request: Request, response: Response) {
    const { id } = idParamsSchema.parse(request.params)
    const data = updateClientSchema.parse(request.body)

    await findClient(request.params.canteenId, id)
    const client = await prisma.client.update({
      where: { id },
      data,
      include: { children: { orderBy: { name: "asc" } } },
    })
    return response.json({ client: presentClient(client, await getAccountBalance(prisma, id)) })
  }

  async createChild(request: Request, response: Response) {
    const { canteenId } = request.params
    const { id: clientId } = idParamsSchema.parse(request.params)
    const { name } = createChildSchema.parse(request.body)

    await findClient(canteenId, clientId)
    const child = await prisma.child.create({ data: { canteenId, clientId, name } })
    return response.status(201).json({ child })
  }

  async updateChild(request: Request, response: Response) {
    const { id: clientId, childId } = childParamsSchema.parse(request.params)
    const data = updateChildSchema.parse(request.body)

    await findClient(request.params.canteenId, clientId)
    if (!(await prisma.child.findFirst({ where: { id: childId, clientId } }))) {
      throw new AppError("Filho não encontrado", 404)
    }

    const child = await prisma.child.update({ where: { id: childId }, data })
    return response.json({ child })
  }

  // Extrato em ordem cronológica, com o saldo acumulado após cada lançamento.
  async statement(request: Request, response: Response) {
    const { canteenId } = request.params
    const { id: clientId } = idParamsSchema.parse(request.params)
    const { page, perPage } = statementQuerySchema.parse(request.query)

    await findClient(canteenId, clientId)
    const entries = await prisma.entry.findMany({
      where: { canteenId, clientId },
      include: entryInclude,
      orderBy: [{ referenceDate: "asc" }, { recordedAt: "asc" }, { id: "asc" }],
    })

    let balanceCents = 0
    const statement = entries.map((entry) => {
      balanceCents += entry.amountCents
      return { ...presentEntry(entry), balanceAfterCents: balanceCents }
    })

    // As páginas contam a partir do lançamento mais recente, mantendo a ordem cronológica em cada uma.
    const end = Math.max(statement.length - (page - 1) * perPage, 0)
    const start = Math.max(end - perPage, 0)

    return response.json({
      balance: describeBalance(balanceCents),
      entries: statement.slice(start, end),
      total: statement.length,
      page,
      perPage,
    })
  }
}
