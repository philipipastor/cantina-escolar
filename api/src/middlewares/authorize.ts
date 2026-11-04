import type { NextFunction, Request, Response } from "express"
import type { Role } from "@prisma/client"
import { AppError } from "../utils/AppError"

export function authorize(...roles: Role[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) {
      throw new AppError("Não autenticado", 401)
    }

    if (!roles.includes(request.user.role)) {
      throw new AppError("Você não possui permissão para esta ação", 403)
    }

    next()
  }
}
