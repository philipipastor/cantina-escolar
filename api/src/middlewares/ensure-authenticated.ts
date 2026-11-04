import type { NextFunction, Request, Response } from "express"
import { verify } from "jsonwebtoken"
import { authConfig } from "../configs/auth"
import { prisma } from "../prisma"
import { AppError } from "../utils/AppError"

type JwtPayload = { sub: string; tokenVersion: number }

export async function ensureAuthenticated(request: Request, _response: Response, next: NextFunction) {
  const authorization = request.headers.authorization

  if (!authorization) {
    throw new AppError("Token não informado", 401)
  }

  const [type, token] = authorization.split(" ")
  if (type !== "Bearer" || !token) {
    throw new AppError("Token inválido", 401)
  }

  let payload: JwtPayload
  try {
    payload = verify(token, authConfig.secret, { algorithms: ["HS256"] }) as JwtPayload
  } catch {
    throw new AppError("Token JWT inválido ou expirado", 401)
  }

  // Consulta o usuário a cada requisição: inativar ou trocar a senha derruba o acesso na hora.
  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
    throw new AppError("Sua sessão expirou. Faça login novamente.", 401)
  }

  request.user = { id: user.id, role: user.role, canteenId: user.canteenId }
  return next()
}
