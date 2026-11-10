import { z } from "zod"
import { isValidAmount } from "../../lib/money"

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(150, "Nome muito longo"),
  notes: z.string().trim().max(1000, "Texto muito longo"),
  phone: z.string().trim().max(30, "Telefone muito longo"),
})

export type ClientFormInput = z.infer<typeof clientSchema>

export const newClientSchema = clientSchema
  .extend({
    openingNature: z.enum(["NONE", "DEBT", "CREDIT"]),
    openingAmount: z.string(),
  })
  .superRefine((data, context) => {
    if (data.openingNature === "NONE") return
    if (!isValidAmount(data.openingAmount)) {
      context.addIssue({ code: "custom", path: ["openingAmount"], message: "Informe um valor válido" })
    }
  })

export type NewClientFormInput = z.infer<typeof newClientSchema>
