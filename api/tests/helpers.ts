import { randomUUID } from "node:crypto"
import { hash } from "bcryptjs"
import request from "supertest"
import { app } from "../src/app"
import { APP_HEADER, APP_HEADER_VALUE } from "../src/middlewares/require-app-header"
import { prisma } from "../src/prisma"
import { SESSION_COOKIE } from "../src/utils/session-cookie"

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

// Simula as telas: envia o cabeçalho exigido contra CSRF e, quando houver, o cookie de sessão.
function client(token?: string) {
  const prepare = (test: request.Test) => {
    test.set(APP_HEADER, APP_HEADER_VALUE)
    if (token) test.set("Cookie", `${SESSION_COOKIE}=${token}`)
    return test
  }
  return {
    get: (url: string) => prepare(request(app).get(url)),
    post: (url: string) => prepare(request(app).post(url)),
    patch: (url: string) => prepare(request(app).patch(url)),
    delete: (url: string) => prepare(request(app).delete(url)),
  }
}

export const authenticated = (token: string) => client(token)
export const anonymous = () => client()

export type Api = ReturnType<typeof client>

// Lê o token do cookie gravado pela resposta, como o navegador faria.
export function sessionTokenFrom(response: request.Response) {
  const cookies = ([] as string[]).concat(response.headers["set-cookie"] ?? [])
  const session = cookies.find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`))
  return session?.split(";")[0].slice(SESSION_COOKIE.length + 1) ?? ""
}

export async function signIn(username: string, password = PASSWORD) {
  const response = await anonymous().post("/sessions").send({ username, password }).expect(200)
  return authenticated(sessionTokenFrom(response))
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

/**
 * Compra de um valor específico, o jeito mais curto de criar dívida nos testes. Cria direto no
 * banco um produto com esse preço, na cantina do cliente (ou na primeira, se o cliente não existir).
 */
export async function purchaseBody(clientId: string, cents: number, extra: object = {}) {
  const owner = await prisma.client.findUnique({ where: { id: clientId }, select: { canteenId: true } })
  const canteenId = owner?.canteenId ?? (await prisma.canteen.findFirstOrThrow()).id
  const product = await prisma.product.create({
    data: { canteenId, name: `Lanche ${randomUUID().slice(0, 8)}`, priceCents: cents },
  })
  return {
    clientId,
    consumer: { type: "UNIDENTIFIED" },
    items: [{ productId: product.id, quantity: 1 }],
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
