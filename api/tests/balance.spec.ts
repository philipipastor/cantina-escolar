import { describeBalance, getPaymentEffect, getPurchaseEffect } from "../src/utils/balance"
import { today } from "../src/utils/dates"

describe("describeBalance", () => {
  it("separa crédito, dívida e saldo zerado", () => {
    expect(describeBalance(2000)).toMatchObject({
      status: "CREDIT",
      availableCreditCents: 2000,
      amountOwedCents: 0,
    })
    expect(describeBalance(-1500)).toMatchObject({
      status: "DEBT",
      availableCreditCents: 0,
      amountOwedCents: 1500,
    })
    expect(describeBalance(0).status).toBe("ZERO")
  })
})

describe("getPurchaseEffect", () => {
  it("usa só o crédito quando ele cobre a compra", () => {
    const effect = getPurchaseEffect(5000, 2000)
    expect(effect.creditUsedCents).toBe(2000)
    expect(effect.onAccountCents).toBe(0)
    expect(effect.balanceAfter.balanceCents).toBe(3000)
  })

  it("transforma em fiado o que o crédito não cobre", () => {
    const effect = getPurchaseEffect(2000, 3500)
    expect(effect.creditUsedCents).toBe(2000)
    expect(effect.onAccountCents).toBe(1500)
    expect(effect.balanceAfter.amountOwedCents).toBe(1500)
  })

  it("lança tudo como fiado em conta sem crédito ou já devedora", () => {
    expect(getPurchaseEffect(0, 1000).onAccountCents).toBe(1000)
    const debtor = getPurchaseEffect(-500, 1000)
    expect(debtor.creditUsedCents).toBe(0)
    expect(debtor.balanceAfter.amountOwedCents).toBe(1500)
  })
})

describe("getPaymentEffect", () => {
  it("abate a dívida primeiro e o excedente vira crédito", () => {
    const effect = getPaymentEffect(-1500, 10000)
    expect(effect.appliedToDebtCents).toBe(1500)
    expect(effect.creditAddedCents).toBe(8500)
    expect(effect.balanceAfter.availableCreditCents).toBe(8500)
  })

  it("aceita pagamento parcial", () => {
    const effect = getPaymentEffect(-5000, 2000)
    expect(effect.appliedToDebtCents).toBe(2000)
    expect(effect.creditAddedCents).toBe(0)
    expect(effect.balanceAfter.amountOwedCents).toBe(3000)
  })

  it("trata como depósito o recebimento em conta sem dívida", () => {
    const effect = getPaymentEffect(0, 30000)
    expect(effect.appliedToDebtCents).toBe(0)
    expect(effect.creditAddedCents).toBe(30000)
  })
})

describe("today", () => {
  it("não avança o dia à noite, quando já é o dia seguinte em UTC", () => {
    expect(today(new Date("2026-03-11T02:30:00Z"))).toBe("2026-03-10")
    expect(today(new Date("2026-03-11T03:30:00Z"))).toBe("2026-03-11")
  })
})
