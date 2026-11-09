import { api } from "../../lib/api"
import type { LoginInput } from "./schemas"
import type { SessionUser } from "./types"

// O token fica no cookie httpOnly gravado pela API; aqui só circulam os dados do usuário.
export async function signIn(input: LoginInput) {
  const { data } = await api.post<{ user: SessionUser }>("/sessions", input)
  return data.user
}

export async function signOut() {
  await api.delete("/sessions")
}

export async function fetchCurrentUser() {
  const { data } = await api.get<{ user: SessionUser }>("/users/me")
  return data.user
}
