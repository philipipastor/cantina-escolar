import { z } from "zod"

export const createSessionSchema = z
  .object({
    username: z.string().trim().toLowerCase().min(1).max(100),
    password: z.string().min(1).max(200),
  })
  .strict()
