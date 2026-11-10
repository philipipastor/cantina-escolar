import { useCallback, useEffect, useRef, useState } from "react"
import { ApiError, toApiError } from "../lib/api"

/**
 * Carrega dados da API e controla carregando e erro, para cada tela não repetir esse código.
 * Quando `load` muda, busca de novo e descarta respostas antigas que cheguem atrasadas.
 * Passe `load` com useCallback, para ele só mudar quando os parâmetros mudarem.
 */
export function useApiData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const latestRequest = useRef(0)

  useEffect(() => {
    const request = ++latestRequest.current
    load()
      .then((result) => {
        if (request !== latestRequest.current) return
        setData(result)
        setError(null)
      })
      .catch((failure: unknown) => {
        if (request !== latestRequest.current) return
        setError(failure instanceof ApiError ? failure : toApiError(failure))
      })
      .finally(() => {
        if (request === latestRequest.current) setIsLoading(false)
      })
  }, [load, attempt])

  const reload = useCallback(() => {
    setIsLoading(true)
    setAttempt((current) => current + 1)
  }, [])

  return { data, error, isLoading, reload }
}
