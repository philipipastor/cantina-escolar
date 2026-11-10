import { z } from "zod"

export const canteenSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da empresa").max(120, "Nome muito longo"),
})

export type CanteenFormInput = z.infer<typeof canteenSchema>
