import type { Request, Response } from "express"
import { compare, hashSync } from "bcryptjs"
import { randomBytes } from "node:crypto"
import { prisma } from "../prisma"
import { createSessionSchema } from "../schemas/sessions-schema"
import { AppError } from "../utils/AppError"
import { signToken } from "../utils/token"

// Compara um hash mesmo sem usuário, para o tempo de resposta não revelar quais logins existem.
const dummyHash = hashSync(randomBytes(32).toString("hex"), 10)

export class SessionsController {
  async create(request: Request, response: Response) {
    const { username, password } = createSessionSchema.parse(request.body)
    const user = await prisma.user.findUnique({ where: { username }, include: { canteen: true } })

    const isPasswordCorrect = await compare(password, user?.password ?? dummyHash)
    if (!user || !isPasswordCorrect || !user.isActive) {
      throw new AppError("Usuário ou senha incorretos", 401)
    }
    // A mensagem só aparece com a senha correta, então não revela nada a quem não sabe a senha.
    if (user.canteen && !user.canteen.isActive) {
      throw new AppError("Sua cantina está inativa. Fale com o administrador.", 403, "CANTEEN_INACTIVE")
    }

    return response.json({
      token: signToken(user),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        canteenId: user.canteenId,
      },
    })
  }
}
