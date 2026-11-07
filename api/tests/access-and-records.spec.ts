import request from "supertest"
import { sign } from "jsonwebtoken"
import { app } from "../src/app"
import { authConfig } from "../src/configs/auth"
import { prisma } from "../src/prisma"
import {
  authenticated,
  createClient,
  createProduct,
  key,
  PASSWORD,
  paymentBody,
  purchaseBody,
  resetDatabase,
  signIn,
} from "./helpers"

let canteenA: string
let canteenB: string

beforeEach(async () => {
  ;({ canteenA, canteenB } = await resetDatabase())
})

afterAll(() => prisma.$disconnect())

describe("login", () => {
  it("recusa senha errada e usuário inexistente com a mesma resposta", async () => {
    const wrong = await request(app)
      .post("/sessions")
      .send({ username: "emp_a", password: "wrong-123" })
      .expect(401)
    const missing = await request(app)
      .post("/sessions")
      .send({ username: "nobody", password: "wrong-123" })
      .expect(401)
    expect(wrong.body).toEqual(missing.body)
  })

  it("devolve o token e não devolve a senha", async () => {
    const { body } = await request(app)
      .post("/sessions")
      .send({ username: "EMP_A", password: PASSWORD })
      .expect(200)
    expect(body.token).toEqual(expect.any(String))
    expect(body.user).toMatchObject({ username: "emp_a", role: "EMPLOYEE", canteenId: canteenA })
    expect(JSON.stringify(body)).not.toContain("password")
  })

  it("exige token nas rotas protegidas e recusa token inválido", async () => {
    await request(app).get(`/canteens/${canteenA}/clients`).expect(401)
    await request(app).get("/users").expect(401)
    await request(app).get("/dashboard").expect(401)
    await authenticated("token-invalido").get("/users/me").expect(401)
  })

  it("recusa token expirado ou assinado com outro segredo", async () => {
    const { id } = await prisma.user.findUniqueOrThrow({ where: { username: "emp_a" } })
    const expired = sign({ tokenVersion: 0 }, authConfig.secret, { subject: id, expiresIn: -10 })
    const forged = sign({ tokenVersion: 0 }, "another-secret-with-at-least-32-chars", { subject: id })
    await authenticated(expired).get("/users/me").expect(401)
    await authenticated(forged).get("/users/me").expect(401)
  })

  it("trocar a senha exige a atual, derruba os outros aparelhos e devolve um token novo", async () => {
    const phone = await signIn("emp_a")

    await phone
      .patch("/users/me/password")
      .send({ currentPassword: "wrong-123", newPassword: "new-password-123" })
      .expect(400)
    const { body } = await phone
      .patch("/users/me/password")
      .send({ currentPassword: PASSWORD, newPassword: "new-password-123" })
      .expect(200)

    await phone.get("/users/me").expect(401)
    await authenticated(body.token).get("/users/me").expect(200)
    await request(app).post("/sessions").send({ username: "emp_a", password: "new-password-123" }).expect(200)
  })
})

describe("separação entre cantinas", () => {
  it("funcionário não acessa outra cantina em nenhuma rota de unidade", async () => {
    const api = await signIn("emp_a")
    for (const route of ["clients", "products", "entries", "dashboard", "daily-review"]) {
      await api.get(`/canteens/${canteenB}/${route}`).expect(403)
    }
    await api.post(`/canteens/${canteenB}/clients`).send({ name: "Intruso" }).expect(403)
  })

  it("um registro de outra cantina não é encontrado pela rota da própria", async () => {
    const apiA = await signIn("emp_a")
    const apiB = await signIn("emp_b")
    const clientB = await createClient(apiB, canteenB, "Cliente B")
    const productB = await createProduct(apiB, canteenB, "Produto B", 500)
    const { body: purchaseB } = await apiB
      .post(`/canteens/${canteenB}/purchases`)
      .send(purchaseBody(clientB.id, 1000))
      .expect(201)
    const a = `/canteens/${canteenA}`

    await apiA.get(`${a}/clients/${clientB.id}`).expect(404)
    await apiA.get(`${a}/clients/${clientB.id}/statement`).expect(404)
    await apiA.patch(`${a}/clients/${clientB.id}`).send({ name: "X" }).expect(404)
    await apiA.patch(`${a}/products/${productB.id}`).send({ priceCents: 1 }).expect(404)
    await apiA.post(`${a}/purchases`).send(purchaseBody(clientB.id, 500)).expect(404)
    await apiA.post(`${a}/payments`).send(paymentBody(clientB.id, 500)).expect(404)
    await apiA.get(`${a}/entries/${purchaseB.entry.id}`).expect(404)
    await apiA
      .post(`${a}/entries/${purchaseB.entry.id}/reversal`)
      .send({ reason: "Tentativa", idempotencyKey: key() })
      .expect(404)
  })

  it("não vende produto de outra cantina", async () => {
    const apiA = await signIn("emp_a")
    const apiB = await signIn("emp_b")
    const clientA = await createClient(apiA, canteenA)
    const productB = await createProduct(apiB, canteenB, "Produto B", 500)

    await apiA
      .post(`/canteens/${canteenA}/purchases`)
      .send({
        clientId: clientA.id,
        consumer: { type: "ACCOUNT_HOLDER" },
        items: [{ type: "PRODUCT", productId: productB.id, quantity: 1 }],
        idempotencyKey: key(),
      })
      .expect(404)
  })

  it("o banco recusa vínculos entre cantinas mesmo por acesso direto", async () => {
    const api = await signIn("emp_a")
    const clientA = await createClient(api, canteenA)
    const user = await prisma.user.findUniqueOrThrow({ where: { username: "emp_a" } })

    await expect(
      prisma.entry.create({
        data: {
          canteenId: canteenB,
          clientId: clientA.id,
          userId: user.id,
          type: "PAYMENT",
          amountCents: 100,
          paymentMethod: "PIX",
          referenceDate: new Date("2026-01-01T00:00:00Z"),
          idempotencyKey: key(),
          requestHash: "x",
        },
      }),
    ).rejects.toThrow()
  })

  it("a lista de cantinas respeita o papel do usuário", async () => {
    const employee = await signIn("emp_a")
    const admin = await signIn("admin")
    const ofEmployee = await employee.get("/canteens").expect(200)
    const ofAdmin = await admin.get("/canteens").expect(200)
    expect(ofEmployee.body.canteens.map((canteen: { id: string }) => canteen.id)).toEqual([canteenA])
    expect(ofAdmin.body.canteens).toHaveLength(2)
  })
})

describe("administrador", () => {
  it("acessa e registra operações em qualquer cantina, ficando como responsável", async () => {
    const admin = await signIn("admin")
    const client = await createClient(admin, canteenB)
    const { body } = await admin
      .post(`/canteens/${canteenB}/purchases`)
      .send(purchaseBody(client.id, 1000))
      .expect(201)
    expect(body.entry.recordedBy.name).toBe("Admin")
  })

  it("só o administrador gerencia usuários", async () => {
    const employee = await signIn("emp_a")
    await employee.get("/users").expect(403)
    await employee
      .post("/users")
      .send({ username: "new_user", name: "Novo", password: "password-123", role: "ADMIN" })
      .expect(403)
  })

  it("cria funcionário vinculado à cantina e impede login duplicado", async () => {
    const admin = await signIn("admin")
    const user = {
      username: "Maria.Silva",
      name: "Maria Silva",
      password: "password-123",
      role: "EMPLOYEE",
      canteenId: canteenA,
    }
    const { body } = await admin.post("/users").send(user).expect(201)
    expect(body.user.username).toBe("maria.silva")
    expect(JSON.stringify(body)).not.toContain("password")

    await admin.post("/users").send(user).expect(409)
    await admin
      .post("/users")
      .send({ ...user, username: "no.canteen", canteenId: undefined })
      .expect(400)
  })

  it("inativar usuário derruba o acesso dele na hora e impede novo login", async () => {
    const admin = await signIn("admin")
    const employee = await signIn("emp_a")
    const { id } = await prisma.user.findUniqueOrThrow({ where: { username: "emp_a" } })

    await admin.patch(`/users/${id}`).send({ isActive: false }).expect(200)

    await employee.get("/users/me").expect(401)
    await request(app).post("/sessions").send({ username: "emp_a", password: PASSWORD }).expect(401)
  })

  it("trocar o funcionário de cantina muda o acesso na hora", async () => {
    const admin = await signIn("admin")
    const employee = await signIn("emp_a")
    const { id } = await prisma.user.findUniqueOrThrow({ where: { username: "emp_a" } })

    await admin.patch(`/users/${id}`).send({ canteenId: canteenB }).expect(200)

    await employee.get(`/canteens/${canteenA}/clients`).expect(403)
    await employee.get(`/canteens/${canteenB}/clients`).expect(200)
  })

  it("não pode inativar a si mesmo", async () => {
    const admin = await signIn("admin")
    const { id } = await prisma.user.findUniqueOrThrow({ where: { username: "admin" } })
    await admin.patch(`/users/${id}`).send({ isActive: false }).expect(400)
  })

  it("redefinir a senha derruba o acesso atual do usuário", async () => {
    const admin = await signIn("admin")
    const employee = await signIn("emp_a")
    const { id } = await prisma.user.findUniqueOrThrow({ where: { username: "emp_a" } })

    await admin.patch(`/users/${id}/password`).send({ newPassword: "redefined-123" }).expect(204)

    await employee.get("/users/me").expect(401)
    await request(app).post("/sessions").send({ username: "emp_a", password: "redefined-123" }).expect(200)
  })
})

describe("clientes e busca", () => {
  it("encontra a conta pelo responsável ou pelo filho, sem diferenciar acentos e maiúsculas", async () => {
    const api = await signIn("emp_a")
    const maria = await createClient(api, canteenA, "Maria José", ["Pedro", "Ana Lúcia"])
    await createClient(api, canteenA, "Carlos")
    const url = `/canteens/${canteenA}/clients`

    for (const search of ["maria jose", "PEDRO", "ana lucia"]) {
      const { body } = await api.get(url).query({ search }).expect(200)
      expect(body.clients.map((client: { id: string }) => client.id)).toEqual([maria.id])
    }
    const all = await api.get(url).expect(200)
    expect(all.body.total).toBe(2)
  })

  it("trata % e _ da busca como texto comum", async () => {
    const api = await signIn("emp_a")
    await createClient(api, canteenA, "Carlos")
    const { body } = await api.get(`/canteens/${canteenA}/clients`).query({ search: "%" }).expect(200)
    expect(body.clients).toEqual([])
  })

  it("mostra o saldo na lista e separa as contas inativas", async () => {
    const api = await signIn("emp_a")
    const client = await createClient(api, canteenA, "Devedora")
    const base = `/canteens/${canteenA}`
    await api.post(`${base}/purchases`).send(purchaseBody(client.id, 1000)).expect(201)

    const active = await api.get(`${base}/clients`).expect(200)
    expect(active.body.clients[0].balance.amountOwedCents).toBe(1000)

    await api.patch(`${base}/clients/${client.id}`).send({ isActive: false }).expect(200)
    const after = await api.get(`${base}/clients`).expect(200)
    expect(after.body.clients).toEqual([])
    const inactive = await api.get(`${base}/clients`).query({ active: "false" }).expect(200)
    expect(inactive.body.clients).toHaveLength(1)
  })

  it("cadastra cliente sem filhos e adiciona filho depois", async () => {
    const api = await signIn("emp_a")
    const client = await createClient(api, canteenA, "Sem filhos")
    expect(client.children).toEqual([])

    const { body } = await api
      .post(`/canteens/${canteenA}/clients/${client.id}/children`)
      .send({ name: "Lucas" })
      .expect(201)
    expect(body.child.name).toBe("Lucas")
  })
})

describe("produtos", () => {
  it("lista os mais vendidos primeiro, desconsidera vendas estornadas e ignora acentos", async () => {
    const api = await signIn("emp_a")
    const base = `/canteens/${canteenA}`
    const client = await createClient(api, canteenA)
    await createProduct(api, canteenA, "Água", 300)
    const coxinha = await createProduct(api, canteenA, "Coxinha", 600)
    const pastel = await createProduct(api, canteenA, "Pastel", 700)

    const sell = (productId: string, quantity: number) =>
      api
        .post(`${base}/purchases`)
        .send({
          clientId: client.id,
          consumer: { type: "ACCOUNT_HOLDER" },
          items: [{ type: "PRODUCT", productId, quantity }],
          idempotencyKey: key(),
          confirmDuplicate: true,
        })
        .expect(201)

    await sell(coxinha.id, 3)
    const { body: reversed } = await sell(pastel.id, 10)
    await api
      .post(`${base}/entries/${reversed.entry.id}/reversal`)
      .send({ reason: "Erro", idempotencyKey: key() })
      .expect(201)

    const { body } = await api.get(`${base}/products`).expect(200)
    expect(body.products.map((product: { name: string }) => product.name)).toEqual([
      "Coxinha",
      "Água",
      "Pastel",
    ])
    expect(body.products[0].recentlySold).toBe(3)

    const found = await api.get(`${base}/products`).query({ search: "agua" }).expect(200)
    expect(found.body.products).toHaveLength(1)
  })
})

describe("painéis e conferência", () => {
  it("não compensa dívida de uma conta com crédito de outra", async () => {
    const api = await signIn("emp_a")
    const base = `/canteens/${canteenA}`
    const debtor = await createClient(api, canteenA, "Devedora")
    const withCredit = await createClient(api, canteenA, "Com crédito")

    await api.post(`${base}/purchases`).send(purchaseBody(debtor.id, 3000)).expect(201)
    await api.post(`${base}/payments`).send(paymentBody(withCredit.id, 5000)).expect(201)

    const { body } = await api.get(`${base}/dashboard`).expect(200)
    expect(body.summary).toMatchObject({
      receivableCents: 3000,
      debtorAccounts: 1,
      availableCreditCents: 5000,
      creditAccounts: 1,
      purchasesCents: 3000,
      paymentsCents: 5000,
    })
    expect(body.summary.paymentsByMethod.PIX).toBe(5000)
  })

  it("o painel geral soma as cantinas e destaca os estornos", async () => {
    const apiA = await signIn("emp_a")
    const apiB = await signIn("emp_b")
    const admin = await signIn("admin")
    const clientA = await createClient(apiA, canteenA)
    const clientB = await createClient(apiB, canteenB)

    const { body: purchase } = await apiA
      .post(`/canteens/${canteenA}/purchases`)
      .send(purchaseBody(clientA.id, 1000))
      .expect(201)
    await apiB.post(`/canteens/${canteenB}/purchases`).send(purchaseBody(clientB.id, 2000)).expect(201)
    await apiA
      .post(`/canteens/${canteenA}/entries/${purchase.entry.id}/reversal`)
      .send({ reason: "Conta errada", idempotencyKey: key() })
      .expect(201)

    const { body } = await admin.get("/dashboard").expect(200)
    expect(body.totals.receivableCents).toBe(2000)
    expect(body.totals.purchasesCents).toBe(2000)
    expect(body.totals.reversalsCount).toBe(1)
    expect(body.canteens).toHaveLength(2)
    expect(body.recentReversals[0]).toMatchObject({
      reason: "Conta errada",
      canteen: { name: "Cantina A" },
      recordedBy: { name: "Funcionário A" },
    })

    await apiA.get("/dashboard").expect(403)
  })

  it("a conferência do dia soma por forma de pagamento e separa os estornados", async () => {
    const api = await signIn("emp_a")
    const base = `/canteens/${canteenA}`
    const client = await createClient(api, canteenA)
    const date = "2026-02-10"

    await api
      .post(`${base}/purchases`)
      .send(purchaseBody(client.id, 1000, { referenceDate: date }))
      .expect(201)
    const { body: wrong } = await api
      .post(`${base}/purchases`)
      .send(purchaseBody(client.id, 700, { referenceDate: date }))
      .expect(201)
    await api
      .post(`${base}/payments`)
      .send(paymentBody(client.id, 400, { referenceDate: date, paymentMethod: "CASH" }))
      .expect(201)
    await api
      .post(`${base}/payments`)
      .send(paymentBody(client.id, 600, { referenceDate: date, paymentMethod: "CARD" }))
      .expect(201)
    await api
      .post(`${base}/entries/${wrong.entry.id}/reversal`)
      .send({ reason: "Erro", idempotencyKey: key() })
      .expect(201)
    // Lançamento de outro dia não entra na conferência.
    await api.post(`${base}/purchases`).send(purchaseBody(client.id, 999)).expect(201)

    const { body } = await api.get(`${base}/daily-review`).query({ date }).expect(200)
    expect(body.entries).toHaveLength(4)
    expect(body.totals).toMatchObject({
      purchasesCents: 1000,
      purchasesCount: 1,
      paymentsCents: 1000,
      paymentsByMethod: { CASH: 400, PIX: 0, CARD: 600 },
      reversedEntries: 1,
    })
  })
})
