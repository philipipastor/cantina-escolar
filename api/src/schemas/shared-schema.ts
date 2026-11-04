import { z } from "zod"
import { isValidDate, today } from "../utils/dates"

// Maior valor aceito em uma única operação: R$ 1.000.000,00.
export const MAX_AMOUNT_CENTS = 100_000_000

export const idField = z.uuid("Identificador inválido")
export const idParamsSchema = z.object({ id: idField })
export const canteenParamsSchema = z.object({ canteenId: idField })

export const centsField = z
  .number({ error: (issue) => (issue.input === undefined ? "Informe o valor" : "Valor inválido") })
  .int("Informe o valor em centavos inteiros")
  .positive("O valor deve ser maior que zero")
  .max(MAX_AMOUNT_CENTS, "Valor acima do limite permitido")

export const requiredText = (label: string, max: number) =>
  z
    .string({ error: `Informe ${label}` })
    .trim()
    .min(1, `Informe ${label}`)
    .max(max, "Texto muito longo")

// Texto opcional em que string vazia significa "sem valor".
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "Texto muito longo")
    .nullish()
    .transform((value) => (value === undefined ? undefined : value || null))

export const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a data no formato AAAA-MM-DD")
  .refine(isValidDate, "Data inválida")

// Data de consumo ou pagamento: nunca futura; se omitida, vale hoje em Brasília.
export const referenceDateField = dateField
  .refine((value) => value <= today(), "A data não pode ser futura")
  .optional()
  .transform((value) => value ?? today())

// Gerada pela tela ao abrir o formulário; é o que impede duplicar em novas tentativas.
export const idempotencyKeyField = z.string({ error: "Informe a chave da operação" }).trim().min(8).max(100)

export const activeQueryField = z
  .enum(["true", "false"])
  .default("true")
  .transform((value) => value === "true")

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(30),
})

// Escapa os curingas do LIKE em um termo digitado pelo usuário.
export function toLikeTerm(term = "") {
  return `%${term.replace(/[\\%_]/g, (character) => `\\${character}`)}%`
}
