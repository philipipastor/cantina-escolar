// O saldo é um único valor com sinal: positivo é crédito disponível, negativo é saldo devedor.
export function describeBalance(balanceCents: number) {
  return {
    balanceCents,
    status: balanceCents > 0 ? "CREDIT" : balanceCents < 0 ? "DEBT" : "ZERO",
    availableCreditCents: Math.max(balanceCents, 0),
    amountOwedCents: Math.max(-balanceCents, 0),
  }
}

// O crédito cobre o que puder; o restante da compra vira fiado.
export function getPurchaseEffect(balanceCents: number, totalCents: number) {
  const creditUsedCents = Math.min(Math.max(balanceCents, 0), totalCents)
  return {
    totalCents,
    creditUsedCents,
    onAccountCents: totalCents - creditUsedCents,
    balanceBefore: describeBalance(balanceCents),
    balanceAfter: describeBalance(balanceCents - totalCents),
  }
}

// O valor recebido abate primeiro a dívida; o excedente vira crédito.
export function getPaymentEffect(balanceCents: number, amountCents: number) {
  const appliedToDebtCents = Math.min(Math.max(-balanceCents, 0), amountCents)
  return {
    amountCents,
    appliedToDebtCents,
    creditAddedCents: amountCents - appliedToDebtCents,
    balanceBefore: describeBalance(balanceCents),
    balanceAfter: describeBalance(balanceCents + amountCents),
  }
}

export function getBalanceChange(balanceCents: number, changeCents: number) {
  return {
    balanceBefore: describeBalance(balanceCents),
    balanceAfter: describeBalance(balanceCents + changeCents),
  }
}
