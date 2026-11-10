import { prisma } from "../src/prisma"
import { today } from "../src/utils/dates"
import {
  balanceOf,
  createClient,
  createProduct,
  key,
  paymentBody,
  purchaseBody,
  resetDatabase,
  signIn,
  type Api,
} from "./helpers"

let canteen: string
let api: Api
let base: string

beforeEach(async () => {
  const { canteenA } = await resetDatabase()
  canteen = canteenA
  api = await signIn("emp_a")
  base = `/canteens/${canteen}`
})

afterAll(() => prisma.$disconnect())

describe("exemplo do resumo do projeto", () => {
  it("300 de depósito, 280 e 35 de consumo, 100 de pagamento: termina com R$ 85 de crédito", async () => {
    const maria = await createClient(api, canteen, "Maria", ["Pedro", "Ana"])
    const pedro = maria.children.find((child) => child.name === "Pedro")!
    const ana = maria.children.find((child) => child.name === "Ana")!

    await api.post(`${base}/payments`).send(paymentBody(maria.id, 30000)).expect(201)
    expect(await balanceOf(api, canteen, maria.id)).toBe(30000)

    await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(maria.id, 28000, { consumer: { type: "CHILD", childId: pedro.id } }))
      .expect(201)
    expect(await balanceOf(api, canteen, maria.id)).toBe(2000)

    const purchase = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(maria.id, 3500, { consumer: { type: "CHILD", childId: ana.id } }))
      .expect(201)
    expect(purchase.body.effect.creditUsedCents).toBe(2000)
    expect(purchase.body.effect.onAccountCents).toBe(1500)
    expect(purchase.body.balance.amountOwedCents).toBe(1500)

    const payment = await api.post(`${base}/payments`).send(paymentBody(maria.id, 10000)).expect(201)
    expect(payment.body.effect.appliedToDebtCents).toBe(1500)
    expect(payment.body.effect.creditAddedCents).toBe(8500)
    expect(payment.body.balance.availableCreditCents).toBe(8500)

    const { body: statement } = await api.get(`${base}/clients/${maria.id}/statement`).expect(200)
    expect(statement.entries.map((entry: { balanceAfterCents: number }) => entry.balanceAfterCents)).toEqual([
      30000, 2000, -1500, 8500,
    ])
    expect(statement.entries[2].consumer.child.name).toBe("Ana")
  })
})

describe("registrar compra", () => {
  it("calcula a prévia sem salvar", async () => {
    const client = await createClient(api, canteen)
    const snack = await createProduct(api, canteen, "Salgado", 600)

    const { body } = await api
      .post(`${base}/purchases/preview`)
      .send({
        clientId: client.id,
        consumer: { type: "ACCOUNT_HOLDER" },
        items: [{ productId: snack.id, quantity: 2 }],
      })
      .expect(200)

    expect(body.effect.totalCents).toBe(1200)
    expect(body.isDateDifferentFromToday).toBe(false)
    expect(await balanceOf(api, canteen, client.id)).toBe(0)
  })

  it("usa o preço do servidor e preserva o preço praticado após uma alteração", async () => {
    const client = await createClient(api, canteen)
    const juice = await createProduct(api, canteen, "Suco", 500)

    const { body } = await api
      .post(`${base}/purchases`)
      .send({
        clientId: client.id,
        consumer: { type: "ACCOUNT_HOLDER" },
        items: [{ productId: juice.id, quantity: 2, unitPriceCents: 1 }],
        idempotencyKey: key(),
      })
      .expect(201)
    expect(body.entry.amountCents).toBe(-1000)

    await api.patch(`${base}/products/${juice.id}`).send({ priceCents: 900 }).expect(200)

    const { body: details } = await api.get(`${base}/entries/${body.entry.id}`)
    expect(details.entry.items[0].unitPriceCents).toBe(500)
    expect(await balanceOf(api, canteen, client.id)).toBe(-1000)
  })

  it("não vende produto inativo, mas mantém o nome dele no histórico", async () => {
    const client = await createClient(api, canteen)
    const cake = await createProduct(api, canteen, "Bolo", 700)
    const purchase = {
      clientId: client.id,
      consumer: { type: "ACCOUNT_HOLDER" },
      items: [{ productId: cake.id, quantity: 1 }],
    }

    const { body } = await api
      .post(`${base}/purchases`)
      .send({ ...purchase, idempotencyKey: key() })
      .expect(201)
    await api.patch(`${base}/products/${cake.id}`).send({ isActive: false }).expect(200)

    const refused = await api
      .post(`${base}/purchases`)
      .send({ ...purchase, idempotencyKey: key(), confirmDuplicate: true })
      .expect(400)
    expect(refused.body.code).toBe("INACTIVE_PRODUCT")

    const { body: details } = await api.get(`${base}/entries/${body.entry.id}`)
    expect(details.entry.items[0].description).toBe("Bolo")
  })

  it("aceita consumidor não identificado", async () => {
    const client = await createClient(api, canteen)
    const { body } = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 2500))
      .expect(201)

    expect(body.entry.consumer).toEqual({ type: "UNIDENTIFIED", child: null })
  })

  it("não aceita item sem produto cadastrado", async () => {
    const client = await createClient(api, canteen)
    await api
      .post(`${base}/purchases`)
      .send({
        clientId: client.id,
        consumer: { type: "ACCOUNT_HOLDER" },
        items: [{ description: "Lanche", quantity: 1, unitPriceCents: 500 }],
        idempotencyKey: key(),
      })
      .expect(400)
  })

  it("não aceita filho de outra conta nem filho inativo", async () => {
    const maria = await createClient(api, canteen, "Maria", ["Pedro"])
    const joao = await createClient(api, canteen, "João", ["Lucas"])

    await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(maria.id, 500, { consumer: { type: "CHILD", childId: joao.children[0]!.id } }))
      .expect(404)

    const pedro = maria.children[0]!
    await api.patch(`${base}/clients/${maria.id}/children/${pedro.id}`).send({ isActive: false }).expect(200)
    const refused = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(maria.id, 500, { consumer: { type: "CHILD", childId: pedro.id } }))
      .expect(400)
    expect(refused.body.code).toBe("INACTIVE_CHILD")
  })

  it("bloqueia compra em conta inativa, mas ainda recebe pagamento dela", async () => {
    const client = await createClient(api, canteen)
    await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 1000))
      .expect(201)
    await api.patch(`${base}/clients/${client.id}`).send({ isActive: false }).expect(200)

    const refused = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 500))
      .expect(400)
    expect(refused.body.code).toBe("INACTIVE_CLIENT")
    await api.post(`${base}/payments`).send(paymentBody(client.id, 1000)).expect(201)
    expect(await balanceOf(api, canteen, client.id)).toBe(0)
  })

  it("avisa quando o saldo mudou desde a prévia", async () => {
    const client = await createClient(api, canteen)
    await api.post(`${base}/payments`).send(paymentBody(client.id, 1000)).expect(201)

    const { body } = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 500, { expectedBalanceCents: 0 }))
      .expect(409)
    expect(body.code).toBe("BALANCE_CHANGED")
    expect(await balanceOf(api, canteen, client.id)).toBe(1000)
  })
})

describe("datas de lançamento", () => {
  it("aceita data passada, guarda o registro real e ordena o extrato pela data do consumo", async () => {
    const client = await createClient(api, canteen)
    await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 1000))
      .expect(201)
    const { body } = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 500, { referenceDate: "2026-01-15" }))
      .expect(201)

    expect(body.entry.referenceDate).toBe("2026-01-15")
    expect(new Date(body.entry.recordedAt).getTime()).toBeGreaterThan(new Date("2026-01-16").getTime())

    const { body: statement } = await api.get(`${base}/clients/${client.id}/statement`)
    expect(statement.entries[0].referenceDate).toBe("2026-01-15")
    expect(statement.entries[0].balanceAfterCents).toBe(-500)
    expect(statement.balance.balanceCents).toBe(-1500)
  })

  it("recusa data futura e data inexistente", async () => {
    const client = await createClient(api, canteen)
    for (const referenceDate of ["2999-01-01", "2026-02-31"]) {
      await api
        .post(`${base}/purchases`)
        .send(await purchaseBody(client.id, 500, { referenceDate }))
        .expect(400)
    }
  })

  it("marca a prévia quando a data não é a de hoje", async () => {
    const client = await createClient(api, canteen)
    const { body } = await api
      .post(`${base}/purchases/preview`)
      .send({ ...(await purchaseBody(client.id, 500)), referenceDate: "2026-01-15" })
      .expect(200)
    expect(body.isDateDifferentFromToday).toBe(true)
  })
})

describe("proteção contra duplicidade", () => {
  it("uma nova tentativa com a mesma chave não duplica o lançamento", async () => {
    const client = await createClient(api, canteen)
    const body = await purchaseBody(client.id, 1000)

    const first = await api.post(`${base}/purchases`).send(body).expect(201)
    const second = await api.post(`${base}/purchases`).send(body).expect(200)

    expect(second.body.repeated).toBe(true)
    expect(second.body.entry.id).toBe(first.body.entry.id)
    expect(await balanceOf(api, canteen, client.id)).toBe(-1000)
  })

  it("envios simultâneos com a mesma chave geram um único lançamento", async () => {
    const client = await createClient(api, canteen)
    const body = await purchaseBody(client.id, 1000)

    const responses = await Promise.all(
      Array.from({ length: 5 }, () => api.post(`${base}/purchases`).send(body)),
    )

    expect(responses.map((response) => response.status).sort()).toEqual([200, 200, 200, 200, 201])
    expect(await balanceOf(api, canteen, client.id)).toBe(-1000)
  })

  it("recusa a mesma chave com dados diferentes, mesmo em outra conta", async () => {
    const maria = await createClient(api, canteen, "Maria")
    const joao = await createClient(api, canteen, "João")
    const usedKey = key()

    await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(maria.id, 1000, { idempotencyKey: usedKey }))
      .expect(201)

    const { body } = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(joao.id, 1000, { idempotencyKey: usedKey }))
      .expect(409)
    expect(body.code).toBe("IDEMPOTENCY_KEY_REUSED")
    expect(await balanceOf(api, canteen, joao.id)).toBe(0)
  })

  it("avisa sobre compra igual na mesma data e permite lançar após confirmar", async () => {
    const client = await createClient(api, canteen)
    const unconfirmed = { confirmDuplicate: false }

    await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 1000, unconfirmed))
      .expect(201)

    const preview = await api
      .post(`${base}/purchases/preview`)
      .send(await purchaseBody(client.id, 1000))
      .expect(200)
    expect(preview.body.possibleDuplicate).not.toBeNull()

    const refused = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 1000, unconfirmed))
      .expect(409)
    expect(refused.body.code).toBe("POSSIBLE_DUPLICATE")

    await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 1000))
      .expect(201)
    expect(await balanceOf(api, canteen, client.id)).toBe(-2000)
  })

  it("operações simultâneas na mesma conta mantêm o saldo correto", async () => {
    const client = await createClient(api, canteen)
    await api.post(`${base}/payments`).send(paymentBody(client.id, 1000)).expect(201)

    const bodies = await Promise.all(Array.from({ length: 8 }, () => purchaseBody(client.id, 300)))
    const responses = await Promise.all(bodies.map((body) => api.post(`${base}/purchases`).send(body)))

    expect(responses.every((response) => response.status === 201)).toBe(true)
    expect(await balanceOf(api, canteen, client.id)).toBe(1000 - 8 * 300)
  })
})

describe("estorno", () => {
  function reverse(id: string, reason = "Lançado por engano") {
    return api.post(`${base}/entries/${id}/reversal`).send({ reason, idempotencyKey: key() })
  }

  it("devolve o crédito usado e mantém os dois lançamentos no extrato", async () => {
    const client = await createClient(api, canteen)
    await api.post(`${base}/payments`).send(paymentBody(client.id, 2000)).expect(201)
    const { body: purchase } = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 3500))
      .expect(201)
    expect(await balanceOf(api, canteen, client.id)).toBe(-1500)

    const result = await reverse(purchase.entry.id)
    expect(result.status).toBe(201)
    expect(result.body.balance.availableCreditCents).toBe(2000)
    expect(result.body.entry.reason).toBe("Lançado por engano")

    const { body: statement } = await api.get(`${base}/clients/${client.id}/statement`)
    expect(statement.total).toBe(3)
    expect(statement.entries[1].isReversed).toBe(true)
    expect(statement.entries[2].type).toBe("REVERSAL")
  })

  it("exige justificativa e não permite estornar duas vezes nem estornar um estorno", async () => {
    const client = await createClient(api, canteen)
    const { body: purchase } = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 1000))
      .expect(201)
    const id = purchase.entry.id as string

    expect((await reverse(id, "   ")).status).toBe(400)

    const first = await reverse(id)
    expect(first.status).toBe(201)

    const second = await reverse(id)
    expect(second.status).toBe(409)
    expect(second.body.code).toBe("ALREADY_REVERSED")

    const ofReversal = await reverse(first.body.entry.id)
    expect(ofReversal.status).toBe(400)
    expect(ofReversal.body.code).toBe("REVERSAL_OF_REVERSAL")

    expect(await balanceOf(api, canteen, client.id)).toBe(0)
  })

  it("nova tentativa do mesmo estorno não reverte duas vezes", async () => {
    const client = await createClient(api, canteen)
    const { body: purchase } = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 1000))
      .expect(201)
    const body = { reason: "Erro", idempotencyKey: key() }
    const url = `${base}/entries/${purchase.entry.id}/reversal`

    await api.post(url).send(body).expect(201)
    const repeated = await api.post(url).send(body).expect(200)

    expect(repeated.body.repeated).toBe(true)
    expect(await balanceOf(api, canteen, client.id)).toBe(0)
  })

  it("estorna recebimento e saldo inicial", async () => {
    const client = await createClient(api, canteen)
    const { body: payment } = await api
      .post(`${base}/payments`)
      .send(paymentBody(client.id, 1000))
      .expect(201)
    const { body: opening } = await api
      .post(`${base}/opening-balances`)
      .send({
        clientId: client.id,
        nature: "DEBT",
        amountCents: 400,
        description: "Caderno",
        idempotencyKey: key(),
      })
      .expect(201)
    expect(await balanceOf(api, canteen, client.id)).toBe(600)

    expect((await reverse(payment.entry.id)).status).toBe(201)
    expect(await balanceOf(api, canteen, client.id)).toBe(-400)
    expect((await reverse(opening.entry.id)).status).toBe(201)
    expect(await balanceOf(api, canteen, client.id)).toBe(0)
  })
})

describe("refazer lançamento", () => {
  async function reversedPurchase(body: object) {
    const { body: purchase } = await api.post(`${base}/purchases`).send(body).expect(201)
    await api
      .post(`${base}/entries/${purchase.entry.id}/reversal`)
      .send({ reason: "Erro", idempotencyKey: key() })
      .expect(201)
    return purchase.entry.id as string
  }

  it("mantém o preço original e permite corrigir a conta", async () => {
    const wrong = await createClient(api, canteen, "Conta errada")
    const right = await createClient(api, canteen, "Conta certa")
    const juice = await createProduct(api, canteen, "Suco", 500)
    const shared = {
      consumer: { type: "ACCOUNT_HOLDER" },
      items: [{ productId: juice.id, quantity: 2 }],
    }

    const originalId = await reversedPurchase({ ...shared, clientId: wrong.id, idempotencyKey: key() })
    await api.patch(`${base}/products/${juice.id}`).send({ priceCents: 900 }).expect(200)

    const { body } = await api
      .post(`${base}/purchases`)
      .send({
        ...shared,
        clientId: right.id,
        redoneFromId: originalId,
        referenceDate: today(),
        idempotencyKey: key(),
      })
      .expect(201)

    expect(body.entry.amountCents).toBe(-1000)
    expect(body.entry.redoneFromId).toBe(originalId)
    expect(await balanceOf(api, canteen, wrong.id)).toBe(0)
    expect(await balanceOf(api, canteen, right.id)).toBe(-1000)

    const { body: original } = await api.get(`${base}/entries/${originalId}`)
    expect(original.entry.redoneAsId).toBe(body.entry.id)
  })

  it("exige estorno prévio, o mesmo tipo e só permite refazer uma vez", async () => {
    const client = await createClient(api, canteen)

    const { body: active } = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 1000))
      .expect(201)
    const notReversed = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 1000, { redoneFromId: active.entry.id }))
      .expect(400)
    expect(notReversed.body.code).toBe("REDO_WITHOUT_REVERSAL")

    const reversedId = await reversedPurchase(await purchaseBody(client.id, 700))

    const otherType = await api
      .post(`${base}/payments`)
      .send(paymentBody(client.id, 700, { redoneFromId: reversedId }))
      .expect(400)
    expect(otherType.body.code).toBe("REDO_TYPE_MISMATCH")

    await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 700, { redoneFromId: reversedId }))
      .expect(201)
    const second = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 700, { redoneFromId: reversedId }))
      .expect(409)
    expect(second.body.code).toBe("ALREADY_REDONE")
  })

  it("vende de novo um produto que foi inativado, por ser o refazer da venda original", async () => {
    const client = await createClient(api, canteen)
    const cake = await createProduct(api, canteen, "Bolo", 700)
    const shared = {
      clientId: client.id,
      consumer: { type: "ACCOUNT_HOLDER" },
      items: [{ productId: cake.id, quantity: 1 }],
    }

    const originalId = await reversedPurchase({ ...shared, idempotencyKey: key() })
    await api.patch(`${base}/products/${cake.id}`).send({ isActive: false }).expect(200)

    await api
      .post(`${base}/purchases`)
      .send({ ...shared, redoneFromId: originalId, idempotencyKey: key() })
      .expect(201)
  })
})

describe("saldo inicial e devolução de crédito", () => {
  it("registra dívida e crédito anteriores, identificados no extrato", async () => {
    const client = await createClient(api, canteen)

    await api
      .post(`${base}/opening-balances`)
      .send({
        clientId: client.id,
        nature: "DEBT",
        amountCents: 5000,
        description: "Dívida do caderno de 2026",
        idempotencyKey: key(),
      })
      .expect(201)
    expect(await balanceOf(api, canteen, client.id)).toBe(-5000)

    await api
      .post(`${base}/opening-balances`)
      .send({
        clientId: client.id,
        nature: "CREDIT",
        amountCents: 8000,
        description: "Crédito do sistema antigo",
        idempotencyKey: key(),
      })
      .expect(201)
    expect(await balanceOf(api, canteen, client.id)).toBe(3000)

    const { body } = await api.get(`${base}/clients/${client.id}/statement`)
    expect(body.entries[0].type).toBe("OPENING_BALANCE")
    expect(body.entries[0].description).toBe("Dívida do caderno de 2026")
    expect(body.entries[0].consumer).toBeNull()
  })

  it("exige a descrição da origem do saldo", async () => {
    const client = await createClient(api, canteen)
    await api
      .post(`${base}/opening-balances`)
      .send({ clientId: client.id, nature: "DEBT", amountCents: 100, idempotencyKey: key() })
      .expect(400)
  })

  it("devolve crédito até o limite disponível", async () => {
    const client = await createClient(api, canteen)
    await api.post(`${base}/payments`).send(paymentBody(client.id, 8500)).expect(201)

    const excess = await api.post(`${base}/credit-refunds`).send(paymentBody(client.id, 8501)).expect(400)
    expect(excess.body.code).toBe("INSUFFICIENT_CREDIT")

    await api
      .post(`${base}/credit-refunds`)
      .send(paymentBody(client.id, 8500, { paymentMethod: "CASH" }))
      .expect(201)
    expect(await balanceOf(api, canteen, client.id)).toBe(0)
  })

  it("não devolve crédito em conta devedora", async () => {
    const client = await createClient(api, canteen)
    await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 100))
      .expect(201)
    await api.post(`${base}/credit-refunds`).send(paymentBody(client.id, 50)).expect(400)
  })
})

describe("recebimentos", () => {
  it("exige forma de pagamento válida e valor positivo", async () => {
    const client = await createClient(api, canteen)
    await api
      .post(`${base}/payments`)
      .send(paymentBody(client.id, 100, { paymentMethod: "BOLETO" }))
      .expect(400)
    await api.post(`${base}/payments`).send(paymentBody(client.id, 0)).expect(400)
    await api.post(`${base}/payments`).send(paymentBody(client.id, 10.5)).expect(400)
  })

  it("responde com mensagens claras em português para dados inválidos", async () => {
    const client = await createClient(api, canteen)
    const url = `${base}/payments`
    // O JSON descarta campos undefined, então a API os recebe como ausentes.
    const withoutAmount = paymentBody(client.id, 100, { amountCents: undefined })
    const withoutMethod = paymentBody(client.id, 100, { paymentMethod: undefined })

    const missingAmount = await api.post(url).send(withoutAmount).expect(400)
    expect(missingAmount.body.message).toBe("Informe o valor")

    const textAmount = await api
      .post(url)
      .send(paymentBody(client.id, "dez" as unknown as number))
      .expect(400)
    expect(textAmount.body.message).toBe("Valor inválido")

    const zeroAmount = await api.post(url).send(paymentBody(client.id, 0)).expect(400)
    expect(zeroAmount.body.message).toBe("O valor deve ser maior que zero")

    const missingMethod = await api.post(url).send(withoutMethod).expect(400)
    expect(missingMethod.body.message).toBe("Informe a forma de pagamento")

    const invalidId = await api.post(url).send(paymentBody("abc", 100)).expect(400)
    expect(invalidId.body.message).toBe("Identificador inválido")

    const blankReason = await api
      .post(`${base}/opening-balances`)
      .send({ clientId: client.id, nature: "DEBT", amountCents: 100, idempotencyKey: key() })
      .expect(400)
    expect(blankReason.body.message).toBe("Informe a origem do saldo")
  })
})

describe("imutabilidade no banco", () => {
  it("impede alterar ou apagar lançamentos, mesmo por acesso direto", async () => {
    const client = await createClient(api, canteen)
    const { body } = await api
      .post(`${base}/purchases`)
      .send(await purchaseBody(client.id, 1000))
      .expect(201)
    const id = body.entry.id as string

    await expect(prisma.entry.delete({ where: { id } })).rejects.toThrow()
    await expect(prisma.entry.update({ where: { id }, data: { amountCents: -1 } })).rejects.toThrow()
    await expect(prisma.purchaseItem.deleteMany({ where: { entryId: id } })).rejects.toThrow()

    expect(await balanceOf(api, canteen, client.id)).toBe(-1000)
  })
})
