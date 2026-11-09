import axios, { isAxiosError } from "axios"

/**
 * Único ponto de contato com a API.
 * - baseURL "/api": o Vite (e, em produção, o servidor) repassa para a API, na mesma origem das telas.
 * - withCredentials: o navegador envia o cookie de sessão. O token nunca passa pelo JavaScript.
 * - X-Requested-With: cabeçalho exigido pela API contra CSRF.
 */
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "X-Requested-With": "cantina" },
})

type ApiErrorBody = { message?: string; code?: string; details?: Record<string, string[]> }

export class ApiError extends Error {
  readonly status: number | null
  readonly code?: string
  readonly details?: Record<string, string[]>

  constructor(message: string, status: number | null, code?: string, details?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

// Converte qualquer falha de requisição em um ApiError com mensagem pronta para mostrar na tela.
export function toApiError(error: unknown): ApiError {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return new ApiError("Não foi possível falar com o servidor. Verifique sua conexão.", null)
    }
    const { message, code, details } = error.response.data ?? {}
    return new ApiError(message ?? "Algo deu errado. Tente novamente.", error.response.status, code, details)
  }
  return new ApiError("Algo deu errado. Tente novamente.", null)
}

// Chamado quando a API responde 401 em qualquer tela: a sessão expirou ou foi encerrada.
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

api.interceptors.response.use(undefined, (error) => {
  const isLoginAttempt = error.config?.url === "/sessions"
  if (isAxiosError(error) && error.response?.status === 401 && !isLoginAttempt) onUnauthorized?.()
  return Promise.reject(toApiError(error))
})
