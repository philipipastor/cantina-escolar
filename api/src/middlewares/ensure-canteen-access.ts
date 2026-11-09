import type { NextFunction, Request, Response } from "express"
import { Role } from "@prisma/client"
import { prisma } from "../prisma"
import { canteenParamsSchema } from "../schemas/shared-schema"
import { AppError } from "../utils/AppError"

const READ_METHODS = ["GET", "HEAD"]

/**
 * Toda rota de uma unidade passa por aqui: funcionário só acessa a própria cantina.
 * Cantina inativa fica só para consulta do administrador; ninguém registra nada nela.
 */
export async function ensureCanteenAccess(request: Request, _response: Response, next: NextFunction) {
  const { canteenId } = canteenParamsSchema.parse(request.params)
  const user = request.user!

  if (user.role === Role.EMPLOYEE && user.canteenId !== canteenId) {
    throw new AppError("Você não tem acesso a esta cantina", 403)
  }

  const canteen = await prisma.canteen.findUnique({ where: { id: canteenId } })
  if (!canteen) throw new AppError("Cantina não encontrada", 404)

  if (!canteen.isActive) {
    if (user.role === Role.EMPLOYEE) {
      throw new AppError("Esta cantina está inativa", 403, "CANTEEN_INACTIVE")
    }
    if (!READ_METHODS.includes(request.method)) {
      throw new AppError("Esta cantina está inativa. Reative-a para registrar algo.", 409, "CANTEEN_INACTIVE")
    }
  }

  return next()
}
