import type { NextFunction, Request, Response } from "express"
import { AppError } from "../utils/AppError"

export const APP_HEADER = "x-requested-with"
export const APP_HEADER_VALUE = "cantina"

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"]

/**
 * Proteção contra CSRF. Como a sessão fica em cookie, o navegador o envia sozinho; um site malicioso
 * poderia tentar disparar um formulário para a API. Toda requisição que altera dados precisa deste
 * cabeçalho, e um site de outra origem não consegue enviá-lo: o navegador exige permissão do CORS,
 * que só é dada à origem das telas (WEB_ORIGIN).
 */
export function requireAppHeader(request: Request, _response: Response, next: NextFunction) {
  if (!SAFE_METHODS.includes(request.method) && request.get(APP_HEADER) !== APP_HEADER_VALUE) {
    throw new AppError("Requisição recusada", 403, "INVALID_ORIGIN")
  }
  return next()
}
