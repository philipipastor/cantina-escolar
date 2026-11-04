import { sign } from "jsonwebtoken"
import type { User } from "@prisma/client"
import { authConfig } from "../configs/auth"

export function signToken({ id, role, tokenVersion }: Pick<User, "id" | "role" | "tokenVersion">) {
  return sign({ role, tokenVersion }, authConfig.secret, {
    algorithm: "HS256",
    subject: id,
    expiresIn: authConfig.expiresIn,
  })
}
