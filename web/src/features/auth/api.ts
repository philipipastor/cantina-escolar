import { api } from "../../lib/api"
import type { ChangePasswordInput, LoginInput } from "./schemas"
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

// A API grava um cookie novo: este aparelho continua conectado e os demais perdem o acesso.
export async function changePassword({ currentPassword, newPassword }: ChangePasswordInput) {
  await api.patch("/users/me/password", { currentPassword, newPassword })
}
