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

// Número sem o "R$", sempre com duas casas e separador de milhar: 123450 vira "1.234,50".
const amount = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Caminho inverso de parseCents, para preencher um campo: 18450 vira "184,50".
export function centsToInput(cents: number) {
  return amount.format(cents / 100)
}

// Bastam 9 dígitos para passar do limite da API; além disso, o que for digitado é ignorado.
const MAX_INPUT_DIGITS = 9

// Máscara dos campos de valor: só os dígitos contam, e os dois últimos são os centavos.
// "3" vira "0,03", "300" vira "3,00" e "3000" vira "30,00". Sem dígitos, o campo fica vazio.
export function maskMoneyInput(text: string) {
  const digits = text.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAX_INPUT_DIGITS)
  return digits ? centsToInput(Number(digits)) : ""
}
