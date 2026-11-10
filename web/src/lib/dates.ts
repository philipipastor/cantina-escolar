// As datas da API vêm como texto "AAAA-MM-DD". Montar a data com T12:00 evita que o fuso mude o dia.
const toDate = (date: string) => new Date(`${date}T12:00:00`)
const pad = (value: number) => String(value).padStart(2, "0")

// "24 out."
export function formatDayMonth(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" })
    .format(toDate(date))
    .replace(" de ", " ")
}

// "24 out. 2026"
export function formatLongDate(date: string) {
  return `${formatDayMonth(date)} ${toDate(date).getFullYear()}`
}

// "24/10/2026"
export function formatNumericDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR").format(toDate(date))
}

// Horário em que o lançamento foi registrado: "14:32".
export function formatTime(dateTime: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(dateTime))
}

// Hoje no formato da API, no horário do aparelho.
export function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function firstDayOfMonthIso() {
  return `${todayIso().slice(0, 8)}01`
}

// Mês atual no formato "AAAA-MM", o mesmo do <input type="month">.
export function currentMonthIso() {
  return todayIso().slice(0, 7)
}

// "2026-10" vira o primeiro e o último dia do mês: "2026-10-01" e "2026-10-31".
export function monthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number)
  const lastDay = new Date(year, monthNumber, 0).getDate()
  return { from: `${month}-01`, to: `${month}-${pad(lastDay)}` }
}

// "2026-10" vira "Out. 2026", para espaços estreitos.
export function formatShortMonth(month: string) {
  const name = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(toDate(`${month}-01`))
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${month.slice(0, 4)}`
}

// "2026-10" vira "Outubro de 2026".
export function formatMonth(month: string) {
  const text = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    toDate(`${month}-01`),
  )
  return text.charAt(0).toUpperCase() + text.slice(1)
}
