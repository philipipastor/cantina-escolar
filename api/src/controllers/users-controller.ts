import type { Request, Response } from "express"
import { compare, hash } from "bcryptjs"
import { prisma } from "../prisma"
import { idParamsSchema } from "../schemas/shared-schema"
import {
  changePasswordSchema,
  createUserSchema,
  resetPasswordSchema,
  updateUserSchema,
} from "../schemas/users-schema"
import { AppError } from "../utils/AppError"
import { userSelect } from "../utils/presenters"
import { signToken } from "../utils/token"

async function ensureCanteenExists(canteenId: string) {
  const canteen = await prisma.canteen.findUnique({ where: { id: canteenId } })
  if (!canteen) throw new AppError("Cantina não encontrada", 404)
  if (!canteen.isActive) throw new AppError("Esta cantina está inativa", 400, "CANTEEN_INACTIVE")
}

export class UsersController {
  async index(_request: Request, response: Response) {
    const users = await prisma.user.findMany({ select: userSelect, orderBy: { name: "asc" } })
    return response.json({ users })
  }

  async create(request: Request, response: Response) {
    const { password, canteenId, ...data } = createUserSchema.parse(request.body)

    if (canteenId) await ensureCanteenExists(canteenId)
    if (await prisma.user.findUnique({ where: { username: data.username } })) {
      throw new AppError("Já existe um usuário com este login", 409)
    }

    const user = await prisma.user.create({
      data: { ...data, canteenId: canteenId ?? null, password: await hash(password, 10) },
      select: userSelect,
    })
    return response.status(201).json({ user })
  }

  async update(request: Request, response: Response) {
    const { id } = idParamsSchema.parse(request.params)
    const data = updateUserSchema.parse(request.body)

    const current = await prisma.user.findUnique({ where: { id } })
    if (!current) throw new AppError("Usuário não encontrado", 404)

    if (data.isActive === false && id === request.user!.id) {
      throw new AppError("Você não pode inativar o próprio usuário", 400)
    }
    if (data.canteenId) {
      if (current.role === "ADMIN") throw new AppError("O administrador não é vinculado a uma cantina", 400)
      await ensureCanteenExists(data.canteenId)
    }

    const user = await prisma.user.update({ where: { id }, data, select: userSelect })
    return response.json({ user })
  }

  // O administrador redefine a senha de outro usuário; os tokens dele deixam de valer.
  async resetPassword(request: Request, response: Response) {
    const { id } = idParamsSchema.parse(request.params)
    const { newPassword } = resetPasswordSchema.parse(request.body)

    if (!(await prisma.user.findUnique({ where: { id } }))) throw new AppError("Usuário não encontrado", 404)

    await prisma.user.update({
      where: { id },
      data: { password: await hash(newPassword, 10), tokenVersion: { increment: 1 } },
    })
    return response.status(204).send()
  }

  async showMe(request: Request, response: Response) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.user!.id }, select: userSelect })
    return response.json({ user })
  }

  // Devolve um token novo: este aparelho continua conectado e os demais perdem o acesso.
  async changeMyPassword(request: Request, response: Response) {
    const { currentPassword, newPassword } = changePasswordSchema.parse(request.body)
    const { id } = request.user!

    const current = await prisma.user.findUniqueOrThrow({ where: { id } })
    if (!(await compare(currentPassword, current.password))) {
      throw new AppError("A senha atual está incorreta", 400, "WRONG_CURRENT_PASSWORD")
    }

    const user = await prisma.user.update({
      where: { id },
      data: { password: await hash(newPassword, 10), tokenVersion: { increment: 1 } },
    })
    return response.json({ token: signToken(user) })
  }
}
