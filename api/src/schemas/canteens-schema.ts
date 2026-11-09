import { z } from "zod"
import { requiredText } from "./shared-schema"

export const createCanteenSchema = z.object({ name: requiredText("o nome", 120) }).strict()

export const updateCanteenSchema = z
  .object({ name: requiredText("o nome", 120), isActive: z.boolean() })
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: "Informe o nome ou o status da cantina" })
