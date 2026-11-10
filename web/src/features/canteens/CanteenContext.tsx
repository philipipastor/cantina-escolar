import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { Link, Outlet } from "react-router"
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States"
import { useApiData } from "../../hooks/useApiData"
import { useAuth } from "../auth/AuthContext"
import { fetchCanteens } from "./api"
import type { Canteen } from "./types"

const STORAGE_KEY = "cantina:selected-canteen"

function readStoredId() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function storeId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // Sem armazenamento disponível, a escolha vale só até recarregar a página.
  }
}

type CanteenContextValue = {
  canteens: Canteen[]
  canteen: Canteen | null
  selectCanteen: (id: string) => void
  // Busca a lista de novo. A tela de Empresas usa depois de criar ou alterar uma cantina.
  reloadCanteens: () => void
  reloadFailed: boolean
}

const CanteenContext = createContext<CanteenContextValue | null>(null)

/**
 * Guarda a cantina em que se está trabalhando. O funcionário só recebe a própria da API; o admin
 * escolhe uma, e a escolha é lembrada neste aparelho. Guardar só o id é seguro: a API confere o acesso
 * em toda requisição.
 */
export function CanteenProvider({ children }: { children: ReactNode }) {
  const { data, error, isLoading, reload } = useApiData(fetchCanteens)
  const [selectedId, setSelectedId] = useState(readStoredId)

  const selectCanteen = useCallback((id: string) => {
    storeId(id)
    setSelectedId(id)
  }, [])

  const value = useMemo(() => {
    const canteens = data ?? []
    const active = canteens.filter((canteen) => canteen.isActive)
    const canteen = canteens.find((item) => item.id === selectedId) ?? active[0] ?? canteens[0] ?? null
    return { canteens, canteen, selectCanteen, reloadCanteens: reload, reloadFailed: Boolean(error) }
  }, [data, error, selectedId, selectCanteen, reload])

  if (isLoading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error.message} onRetry={reload} />

  return <CanteenContext.Provider value={value}>{children}</CanteenContext.Provider>
}

export function useCanteen() {
  const context = useContext(CanteenContext)
  if (!context) throw new Error("useCanteen precisa estar dentro de <CanteenProvider>")
  return context
}

// Para telas que só fazem sentido com uma cantina. Use dentro de <CanteenGate>, que garante que ela existe.
export function useCurrentCanteen() {
  const { canteen } = useCanteen()
  if (!canteen) throw new Error("useCurrentCanteen precisa estar dentro de <CanteenGate>")
  return canteen
}

export function CanteenGate() {
  const { canteen } = useCanteen()
  const { user } = useAuth()
  if (!canteen) {
    return user?.role === "ADMIN" ? (
      <EmptyState
        title="Nenhuma cantina cadastrada"
        description="Cadastre uma cantina para começar a usar o sistema."
        action={
          <Link to="/empresas" className="text-small font-semibold text-primary hover:underline">
            Cadastrar cantina
          </Link>
        }
      />
    ) : (
      <EmptyState
        title="Nenhuma cantina disponível"
        description="Fale com o administrador para liberar o seu acesso."
      />
    )
  }
  return <Outlet />
}
