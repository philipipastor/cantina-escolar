import type { NextFunction, Request, Response } from "express"
import { Role } from "@prisma/client"
import { prisma } from "../prisma"
import { canteenParamsSchema } from "../schemas/shared-schema"
import { AppError } from "../utils/AppError"

// Toda rota de uma unidade passa por aqui: funcionário só acessa a própria cantina.
export async function ensureCanteenAccess(request: Request, _response: Response, next: NextFunction) {
  const { canteenId } = canteenParamsSchema.parse(request.params)
  const user = request.user!

  if (user.role === Role.EMPLOYEE && user.canteenId !== canteenId) {
    throw new AppError("Você não tem acesso a esta cantina", 403)
  }

  const canteen = await prisma.canteen.findUnique({ where: { id: canteenId } })
  if (!canteen) throw new AppError("Cantina não encontrada", 404)

  return next()
}
