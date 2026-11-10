import { prisma } from "../src/prisma"
import { createClient, key, paymentBody, purchaseBody, resetDatabase, signIn, type Api } from "./helpers"

let canteenA: string
let api: Api
let base: string

beforeEach(async () => {
  ;({ canteenA } = await resetDatabase())
  api = await signIn("emp_a")
  base = `/canteens/${canteenA}`
})

afterAll(() => prisma.$disconnect())

const names = (body: { clients: { name: string }[] }) => body.clients.map((client) => client.name)

describe("lista de clientes para a tela", () => {
  it("filtra por quem deve e por quem tem crédito", async () => {
    const devedor = await createClient(api, canteenA, "Devedor")
    const comCredito = await createClient(api, canteenA, "Com crédito")
    await createClient(api, canteenA, "Em dia")
    await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(devedor.id, 1000))
      .expect(201)
    await api.post(`${base}/payments`).send(paymentBody(comCredito.id, 500)).expect(201)

    const debt = await api.get(`${base}/clients`).query({ status: "DEBT" }).expect(200)
    expect(names(debt.body)).toEqual(["Devedor"])
    expect(debt.body.total).toBe(1)

    const credit = await api.get(`${base}/clients`).query({ status: "CREDIT" }).expect(200)
    expect(names(credit.body)).toEqual(["Com crédito"])

    const all = await api.get(`${base}/clients`).expect(200)
    expect(all.body.total).toBe(3)
    await api.get(`${base}/clients`).query({ status: "OUTRO" }).expect(400)
  })

  it("busca pelo telefone só pelos dígitos", async () => {
    await api.post(`${base}/clients`).send({ name: "Maria", phone: "(11) 98765-4321" }).expect(201)
    await createClient(api, canteenA, "Carlos")

    for (const search of ["98765", "(11) 9876", "11987654321"]) {
      const { body } = await api.get(`${base}/clients`).query({ search }).expect(200)
      expect(names(body)).toEqual(["Maria"])
    }
  })

  it("informa a última compra e ignora as estornadas", async () => {
    const maria = await createClient(api, canteenA, "Maria")
    const lastPurchase = async () => {
      const { body } = await api.get(`${base}/clients`).expect(200)
      return body.clients[0].lastPurchaseDate
    }
    expect(await lastPurchase()).toBeNull()

    await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(maria.id, 100, { referenceDate: "2026-01-10" }))
      .expect(201)
    const newer = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(maria.id, 200, { referenceDate: "2026-02-20" }))
      .expect(201)
    expect(await lastPurchase()).toBe("2026-02-20")

    await api
      .post(`${base}/entries/${newer.body.entry.id}/reversal`)
      .send({ reason: "Lançado errado", idempotencyKey: key() })
      .expect(201)
    expect(await lastPurchase()).toBe("2026-01-10")
  })
})

describe("extrato por período", () => {
  it("recorta o período sem perder o saldo acumulado e soma só o que não foi estornado", async () => {
    const maria = await createClient(api, canteenA, "Maria")
    const url = `${base}/clients/${maria.id}/statement`
    await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(maria.id, 1000, { referenceDate: "2026-01-10" }))
      .expect(201)
    await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(maria.id, 2000, { referenceDate: "2026-02-10" }))
      .expect(201)
    const reversed = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(maria.id, 400, { referenceDate: "2026-02-11" }))
      .expect(201)
    await api
      .post(`${base}/payments`)
      .send(paymentBody(maria.id, 500, { referenceDate: "2026-02-12" }))
      .expect(201)
    await api
      .post(`${base}/entries/${reversed.body.entry.id}/reversal`)
      .send({ reason: "Lançado errado", idempotencyKey: key() })
      .expect(201)

    const { body } = await api.get(url).query({ from: "2026-02-01", to: "2026-02-28" }).expect(200)
    expect(body.entries[0].balanceAfterCents).toBe(-3000)
    expect(body.period).toEqual({ purchasedCents: 2000, paidCents: 500 })

    await api.get(url).query({ from: "ontem" }).expect(400)
  })
})
