import type { SignOptions } from "jsonwebtoken"
import { env } from "./env"

export const authConfig = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
}
