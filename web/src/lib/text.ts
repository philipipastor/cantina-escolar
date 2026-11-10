// "Maria Silva" vira "MS", para os avatares.
export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)
  return letters.toUpperCase()
}

// "Maria Silva" vira "Maria".
export function firstName(name: string) {
  return name.trim().split(/\s+/)[0]
}

// Compara buscas sem diferenciar maiúsculas nem acentos: "pao" encontra "Pão de forma".
export function matchesSearch(text: string, search: string) {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
  return normalize(text).includes(normalize(search.trim()))
}

// ["Pedro", "Ana"] vira "Pedro e Ana".
export function joinNames(names: string[]) {
  return new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" }).format(names)
}

// Formata enquanto digita: "11987654321" vira "(11) 98765-4321".
export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits && `(${digits}`
  const prefix = digits.length > 10 ? 7 : 6
  if (digits.length <= prefix) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, prefix)}-${digits.slice(prefix)}`
}
