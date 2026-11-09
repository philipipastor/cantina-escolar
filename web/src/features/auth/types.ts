export type Role = "ADMIN" | "EMPLOYEE"

export type SessionUser = {
  id: string
  username: string
  name: string
  role: Role
  canteenId: string | null
}
