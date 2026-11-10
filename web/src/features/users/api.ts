import { api } from "../../lib/api"
import type { NewUserInput, User, UserUpdate } from "./types"

export async function fetchUsers() {
  const { data } = await api.get<{ users: User[] }>("/users")
  return data.users
}

export async function createUser(input: NewUserInput) {
  const { data } = await api.post<{ user: User }>("/users", input)
  return data.user
}

export async function updateUser(id: string, input: UserUpdate) {
  const { data } = await api.patch<{ user: User }>(`/users/${id}`, input)
  return data.user
}

// A API também desconecta a pessoa dos outros aparelhos.
export async function resetUserPassword(id: string, newPassword: string) {
  await api.patch(`/users/${id}/password`, { newPassword })
}
