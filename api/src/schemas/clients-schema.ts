import { z } from "zod"
import {
  activeQueryField,
  dateField,
  idField,
  optionalText,
  paginationSchema,
  requiredText,
} from "./shared-schema"

export const listClientsSchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  active: activeQueryField,
  status: z.enum(["DEBT", "CREDIT"]).optional(),
})

export const createClientSchema = z
  .object({
    name: requiredText("o nome", 150),
    phone: optionalText(30),
    notes: optionalText(1000),
    children: z
      .array(z.object({ name: requiredText("o nome do filho", 150) }).strict())
      .max(30)
      .default([]),
  })
  .strict()

export const updateClientSchema = z
  .object({
    name: requiredText("o nome", 150).optional(),
    phone: optionalText(30),
    notes: optionalText(1000),
    isActive: z.boolean().optional(),
  })
  .strict()

export const createChildSchema = z.object({ name: requiredText("o nome", 150) }).strict()

export const updateChildSchema = z
  .object({
    name: requiredText("o nome", 150),
    isActive: z.boolean(),
  })
  .partial()
  .strict()

export const childParamsSchema = z.object({ id: idField, childId: idField })

export const statementQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(200).default(50),
  from: dateField.optional(),
  to: dateField.optional(),
})
