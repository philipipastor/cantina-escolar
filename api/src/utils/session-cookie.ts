import type { CookieOptions, Response } from "express"
import type { User } from "@prisma/client"
import { decode } from "jsonwebtoken"
import { env } from "../configs/env"
import { signToken } from "./token"

export const SESSION_COOKIE = "cantina_session"

/**
 * httpOnly: o JavaScript da página não consegue ler o cookie, então um script malicioso (XSS) não rouba a sessão.
 * secure: em produção, o cookie só trafega por HTTPS.
 * sameSite "lax": o navegador não envia o cookie em requisições de outros sites, a primeira barreira contra CSRF.
 */
function cookieOptions(): CookieOptions {
  return { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax", path: "/" }
}

export function setSessionCookie(response: Response, user: Pick<User, "id" | "role" | "tokenVersion">) {
  const token = signToken(user)
  // O cookie expira junto com o token, definido por JWT_EXPIRES_IN.
  const { exp } = decode(token) as { exp: number }
  response.cookie(SESSION_COOKIE, token, { ...cookieOptions(), expires: new Date(exp * 1000) })
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(SESSION_COOKIE, cookieOptions())
}
