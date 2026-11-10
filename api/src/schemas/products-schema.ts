import { z } from "zod"
import { centsField, requiredText } from "./shared-schema"

export const listProductsSchema = z.object({
  search: z.string().trim().max(100).optional(),
  // "all" traz ativos e inativos juntos, para a tela de catálogo. O padrão serve à venda: só os ativos.
  active: z
    .enum(["true", "false", "all"])
    .default("true")
    .transform((value) => (value === "all" ? null : value === "true")),
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
