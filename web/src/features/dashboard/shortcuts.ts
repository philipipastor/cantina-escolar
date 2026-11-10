import {
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  HandCoins,
  Package,
  ShoppingCart,
  UserRoundCog,
  UsersRound,
  type LucideIcon,
} from "lucide-react"
import type { Role } from "../auth/types"

export type Shortcut = {
  label: string
  icon: LucideIcon
  // Sem destino, a tela ainda não existe: o atalho aparece como "Em breve".
  to?: string
}

const sale: Shortcut = { label: "Venda", icon: ShoppingCart, to: "/venda" }
const payment: Shortcut = { label: "Pagamento", icon: HandCoins, to: "/pagamento" }
const products: Shortcut = { label: "Produtos", icon: Package, to: "/produtos" }
const clients: Shortcut = { label: "Clientes", icon: UsersRound, to: "/clientes" }
const dailySales: Shortcut = { label: "Vendas do Dia", icon: CalendarDays, to: "/vendas-do-dia" }
const users: Shortcut = { label: "Usuários", icon: UserRoundCog, to: "/usuarios" }
const summary: Shortcut = { label: "Resumo", icon: ChartNoAxesCombined, to: "/resumo" }
const companies: Shortcut = { label: "Empresas", icon: Building2, to: "/empresas" }

// Atalhos de cada papel, todos no mesmo formato. Usuários e Empresas são só do admin; o Resumo é de todos.
export function shortcutsFor(role: Role) {
  const common = [sale, payment, products, clients, dailySales]
  return role === "ADMIN" ? [...common, users, companies, summary] : [...common, summary]
}
