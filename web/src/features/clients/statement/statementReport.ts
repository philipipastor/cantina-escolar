import { formatNumericDate, formatTime, monthRange, todayIso } from "../../../lib/dates"
import { paymentMethodLabels } from "../paymentMethod"
import type { EntryType, Statement, StatementEntry } from "../types"

// Cor do valor principal do lançamento: verde abate a dívida, vermelho aumenta, neutro para vendas.
export type StatementTone = "ink" | "success" | "primary"

// Um lançamento do histórico, já em texto: venda, pagamento, estorno, saldo anterior ou devolução.
export type StatementBlock = {
  title: string
  tag: string | null
  date: string
  time: string
  details: string[]
  items: { label: string; cents: number }[]
  total: { label: string; cents: number; tone: StatementTone }
  note: string | null
  isReversed: boolean
}

export type StatementResult = "DEBT" | "CREDIT" | "ZERO"

// Tudo o que o PDF mostra, já calculado. Só lê o extrato da API: não cria nem altera lançamentos.
export type StatementReport = {
  title: string
  canteenName: string
  clientName: string
  consumers: string[]
  periodLabel: string
  // Todos os lançamentos do período, do mais antigo para o mais recente, como no relatório da tela.
  entries: StatementBlock[]
  openingBalanceCents: number
  purchasedCents: number
  paidCents: number
  // Saldo anterior, estornos e devoluções de crédito lançados no período: o que faz a conta fechar.
  adjustmentsCents: number
  closingBalanceCents: number
  result: StatementResult
  fileName: string
}

const monthName = (month: string) =>
  new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(`${month}-01T12:00:00`))

// Período de um mês: do dia 1 até o último dia, ou até hoje se o mês ainda está correndo.
function wholeMonth(from: string, to: string) {
  const month = from.slice(0, 7)
  if (!from.endsWith("-01") || to.slice(0, 7) !== month) return null
  return to === monthRange(month).to || to === todayIso() ? month : null
}

// "NOVEMBRO / 2026" ou "PERÍODO: 01/10/2026 A 15/10/2026".
export function statementTitle(from: string, to: string) {
  const month = wholeMonth(from, to)
  if (month) return `${monthName(month)} / ${month.slice(0, 4)}`.toUpperCase()
  return `PERÍODO: ${formatNumericDate(from)} A ${formatNumericDate(to)}`
}

// "01/11 a 30/11" no mesmo ano; com o ano quando o período atravessa anos.
function periodLabel(from: string, to: string) {
  if (from.slice(0, 4) === to.slice(0, 4)) {
    return `${formatNumericDate(from).slice(0, 5)} a ${formatNumericDate(to).slice(0, 5)}`
  }
  return `${formatNumericDate(from)} a ${formatNumericDate(to)}`
}

// "Maria Oliveira" vira "maria-oliveira", sem acentos, para o nome do arquivo.
function slug(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function statementFileName(clientName: string, from: string, to: string) {
  const month = wholeMonth(from, to)
  const period = month
    ? `${monthName(month)}-${month.slice(0, 4)}`
    : `${formatNumericDate(from)}-a-${formatNumericDate(to)}`
  return `extrato-${slug(clientName)}-${slug(period)}.pdf`
}

function consumerName(entry: StatementEntry) {
  if (entry.consumer?.type === "CHILD") return entry.consumer.child?.name ?? null
  if (entry.consumer?.type === "ACCOUNT_HOLDER") return "Responsável"
  return null
}

const reversedTypeNames: Record<EntryType, string> = {
  PURCHASE: "a venda",
  PAYMENT: "o pagamento",
  OPENING_BALANCE: "o saldo anterior",
  CREDIT_REFUND: "a devolução de crédito",
  REVERSAL: "o estorno",
}

function toSale(entry: StatementEntry, number: number) {
  const consumer = consumerName(entry)
  return {
    title: `Venda ${String(number).padStart(2, "0")}`,
    tag: entry.isReversed ? "VENDA ESTORNADA" : null,
    details: consumer ? [`Consumo: ${consumer}`] : [],
    // Itens como registrados na venda: preço da época, mesmo que o produto tenha mudado depois.
    items: entry.items.map((item) => ({
      label: `${item.quantity}x ${item.description}`,
      cents: item.subtotalCents,
    })),
    total: { label: "Total da venda", cents: -entry.amountCents, tone: "ink" as const },
    note: entry.isReversed ? "Venda cancelada: o valor não entra no total de compras." : null,
  }
}

// Os demais lançamentos, com os mesmos nomes do relatório da tela.
function toMovement(entry: StatementEntry) {
  const amount = Math.abs(entry.amountCents)
  const method = entry.paymentMethod && paymentMethodLabels[entry.paymentMethod]
  const reason = entry.reason ? [`Motivo: ${entry.reason}`] : []
  const description = entry.description ? [entry.description] : []
  // Um lançamento estornado continua no histórico, marcado, como na tela.
  const tag = entry.isReversed ? "ESTORNADO" : null
  const note = entry.isReversed ? "Cancelado por um estorno." : null

  switch (entry.type) {
    case "PAYMENT":
      return {
        title: "Pagamento",
        tag,
        details: [...(method ? [`Recebido via ${method}`] : []), ...description],
        total: { label: "Valor pago", cents: amount, tone: "success" as const },
        note: entry.isReversed ? "Pagamento cancelado: o valor não entra nos pagamentos." : null,
      }
    case "OPENING_BALANCE": {
      const isDebt = entry.amountCents < 0
      return {
        title: isDebt ? "Dívida anterior" : "Crédito anterior",
        tag,
        details: ["Saldo de antes de usar o sistema.", ...description],
        total: {
          label: isDebt ? "Valor devido" : "Crédito",
          cents: amount,
          tone: isDebt ? ("primary" as const) : ("success" as const),
        },
        note,
      }
    }
    case "CREDIT_REFUND":
      return {
        title: "Devolução de crédito",
        tag,
        details: [...(method ? [`Devolvido via ${method}`] : []), ...description],
        total: { label: "Valor devolvido", cents: amount, tone: "ink" as const },
        note,
      }
    default: {
      // Estorno: devolve ao saldo o valor do lançamento cancelado.
      const target = entry.reverses
        ? `Cancela ${reversedTypeNames[entry.reverses.type]} de ${formatNumericDate(entry.reverses.referenceDate)}.`
        : "Cancela um lançamento anterior."
      return {
        title: "Estorno",
        tag: null,
        details: [target, ...reason],
        total: {
          label: "Valor estornado",
          cents: amount,
          tone: entry.amountCents > 0 ? ("success" as const) : ("primary" as const),
        },
        note: null,
      }
    }
  }
}

function toBlocks(entries: StatementEntry[]): StatementBlock[] {
  let sales = 0
  return entries.map((entry) => {
    const block = entry.type === "PURCHASE" ? toSale(entry, ++sales) : { ...toMovement(entry), items: [] }
    return {
      ...block,
      date: formatNumericDate(entry.referenceDate),
      time: formatTime(entry.recordedAt),
      isReversed: entry.isReversed,
    }
  })
}

export function buildStatementReport(input: {
  canteenName: string
  clientName: string
  from: string
  to: string
  statement: Statement
}): StatementReport {
  const { statement, from, to, clientName } = input
  // A API já entrega do mais antigo para o mais recente, só com o período pedido.
  const purchases = statement.entries.filter((entry) => entry.type === "PURCHASE")
  const consumers = [
    ...new Set(
      purchases
        .filter((entry) => !entry.isReversed && entry.consumer?.type === "CHILD")
        .map((entry) => entry.consumer?.child?.name)
        .filter((name): name is string => !!name),
    ),
  ]
  const { purchasedCents, paidCents, openingBalanceCents, closingBalanceCents } = statement.period
  // saldo final = saldo inicial − compras + pagamentos + ajustes (negativo = dívida).
  const adjustmentsCents = closingBalanceCents - openingBalanceCents + purchasedCents - paidCents

  return {
    title: statementTitle(from, to),
    canteenName: input.canteenName,
    clientName: clientName.trim(),
    consumers,
    periodLabel: periodLabel(from, to),
    entries: toBlocks(statement.entries),
    openingBalanceCents,
    purchasedCents,
    paidCents,
    adjustmentsCents,
    closingBalanceCents,
    result: closingBalanceCents < 0 ? "DEBT" : closingBalanceCents > 0 ? "CREDIT" : "ZERO",
    fileName: statementFileName(clientName, from, to),
  }
}
