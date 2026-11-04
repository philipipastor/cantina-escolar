import type { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"
import { AppError } from "../utils/AppError"

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      details: error.details,
    })
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      message: error.issues[0]?.message ?? "Dados inválidos",
      issues: error.issues,
    })
  }

  // Erros ao ler o corpo da requisição, como JSON malformado ou grande demais.
  const status = (error as { status?: unknown }).status
  if (typeof status === "number" && status >= 400 && status < 500) {
    return response.status(status).json({ message: "Requisição inválida" })
  }

  console.error(error)
  return response.status(500).json({ message: "Não foi possível concluir a operação. Tente novamente." })
}
