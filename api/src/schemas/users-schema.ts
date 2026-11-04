import { z } from "zod"
import { idField, requiredText } from "./shared-schema"

// O bcrypt considera só os primeiros 72 bytes da senha.
export const passwordField = z
  .string({ error: "Informe a senha" })
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .max(72, "A senha deve ter no máximo 72 caracteres")

export const createUserSchema = z
  .object({
    username: z
      .string({ error: "Informe o usuário" })
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9._-]{3,50}$/, "Use de 3 a 50 letras, números, ponto, hífen ou sublinhado"),
    name: requiredText("o nome", 120),
    password: passwordField,
    role: z.enum(["ADMIN", "EMPLOYEE"]),
    canteenId: idField.nullish(),
  })
  .strict()
  .refine((user) => (user.role === "EMPLOYEE") === Boolean(user.canteenId), {
    message: "Funcionário precisa de uma cantina; administrador não tem cantina",
    path: ["canteenId"],
  })

export const updateUserSchema = z
  .object({
    name: requiredText("o nome", 120),
    isActive: z.boolean(),
    canteenId: idField,
  })
  .partial()
  .strict()

export const resetPasswordSchema = z.object({ newPassword: passwordField }).strict()

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: passwordField,
  })
  .strict()
