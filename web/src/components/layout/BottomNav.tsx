import { HandCoins, House, NotebookPen, Package, UsersRound } from "lucide-react"
import { NavLink } from "react-router"
import { cn } from "../../lib/cn"

// Admin e funcionário usam o mesmo menu. "Início" ocupa o lugar que era de "Resumo" no Figma.
const items = [
  { to: "/", label: "Início", icon: House },
  { to: "/venda", label: "Venda", icon: NotebookPen },
  { to: "/clientes", label: "Clientes", icon: UsersRound },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/pagamento", label: "Pagamento", icon: HandCoins },
]

// Menu fixo do Figma: 66px, borda superior e item ativo com fundo rosado de 50x32.
export function BottomNav() {
  return (
    <nav
      aria-label="Menu principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex h-16.5 max-w-120 px-2 pt-1.5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex h-12.5 flex-col items-center gap-1 rounded-field text-nav font-medium text-muted",
                  "focus-visible:outline-2 focus-visible:outline-primary",
                  isActive && "font-bold text-primary",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-8 w-12.5 items-center justify-center rounded-[10px]",
                      isActive && "bg-primary-soft",
                    )}
                  >
                    <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
