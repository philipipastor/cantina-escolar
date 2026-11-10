import { z } from "zod"

// As mesmas regras da API, para avisar na hora. Quem decide continua sendo a API.
const nameField = z.string().trim().min(1, "Informe o nome").max(120, "Nome muito longo")

export const passwordField = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .max(72, "A senha deve ter no máximo 72 caracteres")

export const newUserSchema = z
  .object({
    name: nameField,
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9._-]{3,50}$/, "Use de 3 a 50 letras, números, ponto, hífen ou sublinhado"),
    role: z.enum(["EMPLOYEE", "ADMIN"]),
    canteenId: z.string(),
    password: passwordField,
  })
  // O funcionário trabalha em uma cantina; o administrador acessa todas.
  .refine((user) => user.role === "ADMIN" || user.canteenId !== "", {
    message: "Selecione a cantina",
    path: ["canteenId"],
  })

export type NewUserFormInput = z.infer<typeof newUserSchema>

export const editUserSchema = z.object({
  name: nameField,
  canteenId: z.string(),
  isActive: z.boolean(),
})

export type EditUserFormInput = z.infer<typeof editUserSchema>

export const resetPasswordSchema = z.object({ newPassword: passwordField })

export type ResetPasswordFormInput = z.infer<typeof resetPasswordSchema>
