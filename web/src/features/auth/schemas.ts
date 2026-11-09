import { z } from "zod"

// Mesmas regras da API: a tela valida para ajudar quem digita, a API valida de novo para proteger.
export const loginSchema = z.object({
  username: z.string().trim().min(1, "Informe o usuário"),
  password: z.string().min(1, "Informe a senha"),
})

export type LoginInput = z.infer<typeof loginSchema>
