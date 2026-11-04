import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Vazio só em `prisma generate` antes de existir o .env; os comandos de banco exigem a URL.
    url: process.env.DATABASE_URL ?? "",
  },
})
