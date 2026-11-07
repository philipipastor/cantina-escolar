import { randomUUID } from "node:crypto"
import { hash } from "bcryptjs"
import request from "supertest"
import { app } from "../src/app"
import { prisma } from "../src/prisma"

export const PASSWORD = "test-password-123"

let passwordHash: string | undefined

// Apaga tudo e recria duas cantinas com um funcionário cada, mais o administrador.
export async function resetDatabase() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "PurchaseItem", "Entry", "Child", "Product", "Client", "User", "Canteen" CASCADE',
  )
  passwordHash ??= await hash(PASSWORD, 4)

  const canteenA = await prisma.canteen.create({ data: { name: "Cantina A" } })
  const canteenB = await prisma.canteen.create({ data: { name: "Cantina B" } })

  await prisma.user.createMany({
    data: [
      { username: "admin", name: "Admin", role: "ADMIN", password: passwordHash },
      {
        username: "emp_a",
        name: "Funcionário A",
        role: "EMPLOYEE",
        canteenId: canteenA.id,
        password: passwordHash,
      },
      {
        username: "emp_b",
        name: "Funcionário B",
        role: "EMPLOYEE",
        canteenId: canteenB.id,
        password: passwordHash,
      },
    ],
  })

  return { canteenA: canteenA.id, canteenB: canteenB.id }
}

export function authenticated(token: string) {
  const header = `Bearer ${token}`
  return {
    get: (url: string) => request(app).get(url).set("Authorization", header),
    post: (url: string) => request(app).post(url).set("Authorization", header),
    patch: (url: string) => request(app).patch(url).set("Authorization", header),
  }
}

export type Api = ReturnType<typeof authenticated>

export async function signIn(username: string, password = PASSWORD) {
  const { body } = await request(app).post("/sessions").send({ username, password }).expect(200)
  return authenticated(body.token)
}

export const key = () => randomUUID()

export async function createClient(api: Api, canteenId: string, name = "Maria", children: string[] = []) {
  const { body } = await api
    .post(`/canteens/${canteenId}/clients`)
    .send({ name, children: children.map((child) => ({ name: child })) })
    .expect(201)
  return body.client as { id: string; children: { id: string; name: string }[] }
}

export async function createProduct(api: Api, canteenId: string, name: string, priceCents: number) {
  const { body } = await api.post(`/canteens/${canteenId}/products`).send({ name, priceCents }).expect(201)
  return body.product as { id: string }
}

// Compra de um item avulso, o jeito mais curto de lançar um valor específico.
export function purchaseBody(clientId: string, cents: number, extra: object = {}) {
  return {
    clientId,
    consumer: { type: "UNIDENTIFIED" },
    items: [{ type: "CUSTOM", description: "Lanche", quantity: 1, unitPriceCents: cents }],
    idempotencyKey: key(),
    confirmDuplicate: true,
    ...extra,
  }
}

export function paymentBody(clientId: string, amountCents: number, extra: object = {}) {
  return { clientId, amountCents, paymentMethod: "PIX", idempotencyKey: key(), ...extra }
}

export async function balanceOf(api: Api, canteenId: string, clientId: string) {
  const { body } = await api.get(`/canteens/${canteenId}/clients/${clientId}`).expect(200)
  return body.client.balance.balanceCents as number
}
