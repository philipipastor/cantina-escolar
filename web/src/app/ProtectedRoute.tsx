import { LoaderCircle } from "lucide-react"
import { Navigate, Outlet } from "react-router"
import { useAuth } from "../features/auth/AuthContext"
import type { Role } from "../features/auth/types"

/**
 * Esconde telas de quem não pode vê-las, só para não confundir. Quem protege de verdade é a API,
 * que confere sessão, perfil e cantina em toda requisição.
 */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { status, user } = useAuth()

  if (status === "checking") {
    return (
      <div
        className="flex min-h-dvh items-center justify-center text-primary"
        role="status"
        aria-label="Carregando"
      >
        <LoaderCircle className="size-8 animate-spin" />
      </div>
    )
  }
  if (status === "anonymous" || !user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

  return <Outlet />
}
