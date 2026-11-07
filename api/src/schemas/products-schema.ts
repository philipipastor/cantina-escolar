import { z } from "zod"
import { activeQueryField, centsField, requiredText } from "./shared-schema"

export const listProductsSchema = z.object({
  search: z.string().trim().max(100).optional(),
  active: activeQueryField,
})

export const createProductSchema = z
  .object({
    name: requiredText("o nome", 150),
    priceCents: centsField,
  })
  .strict()

export const updateProductSchema = z
  .object({
    name: requiredText("o nome", 150),
    priceCents: centsField,
    isActive: z.boolean(),
  })
  .partial()
  .strict()
