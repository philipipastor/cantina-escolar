import type { Request, Response } from "express"
import { Role } from "@prisma/client"
import { prisma } from "../prisma"
import { createCanteenSchema, updateCanteenSchema } from "../schemas/canteens-schema"
import { idParamsSchema } from "../schemas/shared-schema"
import { AppError } from "../utils/AppError"

async function ensureNameIsFree(name: string, ignoredId?: string) {
  const sameName = await prisma.canteen.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, id: { not: ignoredId } },
  })
  if (sameName) throw new AppError("Já existe uma cantina com este nome", 409)
}

export class CanteensController {
  // O administrador vê todas, inclusive as inativas; o funcionário vê só a própria, se estiver ativa.
  async index(request: Request, response: Response) {
    const { role, canteenId } = request.user!
    const canteens = await prisma.canteen.findMany({
      where: role === Role.ADMIN ? {} : { id: canteenId ?? "", isActive: true },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    })
    return response.json({ canteens })
  }

  async create(request: Request, response: Response) {
    const { name } = createCanteenSchema.parse(request.body)
    await ensureNameIsFree(name)

    const canteen = await prisma.canteen.create({ data: { name } })
    return response.status(201).json({ canteen })
  }

  // Renomeia, inativa ou reativa. Inativar não apaga nada: os dados continuam disponíveis para consulta.
  async update(request: Request, response: Response) {
    const { id } = idParamsSchema.parse(request.params)
    const data = updateCanteenSchema.parse(request.body)

    if (!(await prisma.canteen.findUnique({ where: { id } }))) {
      throw new AppError("Cantina não encontrada", 404)
    }
    if (data.name) await ensureNameIsFree(data.name, id)

    const canteen = await prisma.canteen.update({ where: { id }, data })
    return response.json({ canteen })
  }
}
