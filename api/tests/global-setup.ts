import { execSync } from "node:child_process"

// Aplica as migrações no banco de testes antes de rodar a suíte.
export default function globalSetup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://cantina:cantina_dev@localhost:5433/cantina_test"

  if (!new URL(url).pathname.endsWith("_test")) {
    throw new Error('Os testes apagam dados: use um banco cujo nome termine em "_test".')
  }

  execSync("npx prisma migrate deploy", { stdio: "pipe", env: { ...process.env, DATABASE_URL: url } })
}
