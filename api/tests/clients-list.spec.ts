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
    // O estorno é de hoje, fora de fevereiro: no fim de fevereiro a compra de 4,00 ainda estava em aberto.
    expect(body.period).toEqual({
      purchasedCents: 2000,
      paidCents: 500,
      openingBalanceCents: -1000,
      closingBalanceCents: -2900,
    })

    await api.get(url).query({ from: "ontem" }).expect(400)
  })

  it("calcula o saldo no início e no fim do período, incluindo o último dia inteiro", async () => {
    const maria = await createClient(api, canteenA, "Maria")
    const url = `${base}/clients/${maria.id}/statement`
    const buy = async (cents: number, referenceDate: string) =>
      api
        .post(`${base}/purchases`)
        .send(await purchaseBody(maria.id, cents, { referenceDate }))
        .expect(201)

    await buy(2000, "2026-09-30") // antes do período: começa devendo 20,00
    await buy(1200, "2026-10-01")
    await buy(1600, "2026-10-31") // último dia do período
    await api
      .post(`${base}/payments`)
      .send(paymentBody(maria.id, 1000, { referenceDate: "2026-10-15" }))
      .expect(201)
    await buy(900, "2026-11-01") // depois do período

    const { body } = await api.get(url).query({ from: "2026-10-01", to: "2026-10-31" }).expect(200)
    expect(body.period).toEqual({
      purchasedCents: 2800,
      paidCents: 1000,
      openingBalanceCents: -2000,
      closingBalanceCents: -3800,
    })
    expect(body.entries.map((entry: { referenceDate: string }) => entry.referenceDate)).toEqual([
      "2026-10-01",
      "2026-10-15",
      "2026-10-31",
    ])

    // Período sem lançamentos: o saldo não muda do início ao fim.
    const empty = await api.get(url).query({ from: "2026-10-16", to: "2026-10-20" }).expect(200)
    expect(empty.body.period).toMatchObject({ openingBalanceCents: -2200, closingBalanceCents: -2200 })
  })
})
