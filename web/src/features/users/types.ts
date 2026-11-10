import type { Role } from "../auth/types"

export type User = {
  id: string
  username: string
  name: string
  role: Role
  // Vazio para o administrador, que acessa todas as cantinas.
  canteenId: string | null
  isActive: boolean
  createdAt: string
}

export type NewUserInput = {
  name: string
  username: string
  role: Role
  canteenId: string | null
  password: string
}

export type UserUpdate = { name?: string; canteenId?: string; isActive?: boolean }
