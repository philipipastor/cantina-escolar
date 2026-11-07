import { z } from "zod"
import { dateField } from "./shared-schema"

export const periodQuerySchema = z.object({
  from: dateField.optional(),
  to: dateField.optional(),
})

export const dailyReviewQuerySchema = z.object({ date: dateField.optional() })
