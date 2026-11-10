const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

// O dinheiro trafega sempre em centavos inteiros; só a exibição vira "R$ 1.234,50".
export function formatCents(cents: number) {
  return currency.format(cents / 100)
}

// Transforma o que foi digitado ("1.234,5" ou "12") em centavos. Devolve null se não for um valor válido.
export function parseCents(text: string) {
  const normalized = text.trim().replace(/\./g, "").replace(",", ".")
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  return Math.round(Number(normalized) * 100)
}

// Maior valor aceito pela API em uma única operação: R$ 1.000.000,00.
const MAX_AMOUNT_CENTS = 100_000_000

// Confere o texto digitado: precisa ser um valor maior que zero e dentro do limite da API.
export function isValidAmount(text: string) {
  const cents = parseCents(text)
  return cents !== null && cents > 0 && cents <= MAX_AMOUNT_CENTS
}

// Caminho inverso de parseCents, para preencher um campo: 18450 vira "184,50".
export function centsToInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",")
}
