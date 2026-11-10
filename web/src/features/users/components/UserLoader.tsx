import type { ReactNode } from "react"
import { Navigate, useParams } from "react-router"
import { ErrorState, LoadingState } from "../../../components/ui/States"
import { useApiData } from "../../../hooks/useApiData"
import { fetchUsers } from "../api"
import type { User } from "../types"

/**
 * Busca o usuário da URL (/usuarios/:id/...). A API só lista a equipe inteira, que é pequena,
 * então a tela procura nela. Se o id não existir, volta para a lista.
 */
export function UserLoader({ children }: { children: (user: User) => ReactNode }) {
  const { id = "" } = useParams()
  const { data: users, error, reload } = useApiData(fetchUsers)

  if (error && !users) return <ErrorState message={error.message} onRetry={reload} />
  if (!users) return <LoadingState label="Carregando usuário" />
  const user = users.find((item) => item.id === id)
  if (!user) return <Navigate to="/usuarios" replace />
  return children(user)
}
