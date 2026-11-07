import { z } from "zod"
import { requiredText } from "./shared-schema"

export const canteenSchema = z.object({ name: requiredText("o nome", 120) }).strict()
