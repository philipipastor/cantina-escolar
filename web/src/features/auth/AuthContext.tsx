import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { setUnauthorizedHandler } from "../../lib/api"
import { fetchCurrentUser, signIn as signInRequest, signOut as signOutRequest } from "./api"
import type { LoginInput } from "./schemas"
import type { SessionUser } from "./types"

type AuthStatus = "checking" | "authenticated" | "anonymous"

type AuthContextValue = {
  status: AuthStatus
  user: SessionUser | null
  signIn: (input: LoginInput) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Guarda quem está conectado. Como o token fica em cookie httpOnly, o JavaScript não consegue lê-lo:
 * para saber se há sessão, a tela pergunta à API (GET /users/me) ao abrir.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>("checking")

  const clearSession = useCallback(() => {
    setUser(null)
    setStatus("anonymous")
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(clearSession)
    fetchCurrentUser()
      .then((current) => {
        setUser(current)
        setStatus("authenticated")
      })
      .catch(clearSession)
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  const signIn = useCallback(async (input: LoginInput) => {
    const signedIn = await signInRequest(input)
    setUser(signedIn)
    setStatus("authenticated")
  }, [])

  const signOut = useCallback(async () => {
    try {
      await signOutRequest()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo(() => ({ status, user, signIn, signOut }), [status, user, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth precisa estar dentro de <AuthProvider>")
  return context
}
