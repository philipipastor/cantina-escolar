import { hash } from "bcryptjs"
import { prisma } from "../src/prisma"

// Cria só o administrador; cantinas e funcionários são cadastrados pelo sistema.
// Se o admin já existir, nada muda, então SEED_PASSWORD só é exigida na primeira execução.
async function main() {
  if (await prisma.user.findUnique({ where: { username: "admin" } })) {
    console.log("O usuário admin já existe. Nada foi alterado.")
    return
  }

  const password = process.env.SEED_PASSWORD
  if (!password || password.length < 8 || password.length > 72) {
    throw new Error("Defina SEED_PASSWORD no ambiente, com 8 a 72 caracteres.")
  }

  await prisma.user.create({
    data: {
      username: "admin",
      name: "Administrador",
      role: "ADMIN",
      password: await hash(password, 10),
    },
  })

  console.log("Usuário admin criado.")
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
