import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  WEB_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
})

export const env = envSchema.parse(process.env)
