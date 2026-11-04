const brazilDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

// Data de hoje (AAAA-MM-DD) no fuso de Brasília, independente do fuso do servidor.
export function today(now = new Date()) {
  return brazilDate.format(now)
}

export function toDatabaseDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`)
}

export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function isValidDate(date: string) {
  const parsed = toDatabaseDate(date)
  return !Number.isNaN(parsed.getTime()) && formatDate(parsed) === date
}
