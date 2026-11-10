import { z } from "zod"
import { isValidAmount } from "../../lib/money"

export const productSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do produto").max(150, "Nome muito longo"),
  price: z.string().refine(isValidAmount, "Informe um preço válido"),
  isActive: z.boolean(),
})

export type ProductFormInput = z.infer<typeof productSchema>
