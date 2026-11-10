import type { ReactNode } from "react"
import { Link } from "react-router"
import type { Shortcut } from "../shortcuts"

const tileClass =
  "flex h-34 flex-col items-center justify-center gap-2.5 rounded-card border border-line bg-surface"

// Leva ao destino ou, se a tela ainda não existe, fica com o mesmo visual e o aviso "Em breve".
function ShortcutLink({ shortcut, children }: { shortcut: Shortcut; children: ReactNode }) {
  if (!shortcut.to) {
    return (
      <div aria-disabled className={tileClass}>
        {children}
      </div>
    )
  }
  return (
    <Link to={shortcut.to} className={`${tileClass} transition hover:bg-page`}>
      {children}
    </Link>
  )
}

// Quadrado da grade de atalhos: ícone num círculo rosa e o nome embaixo.
export function ShortcutTile({ shortcut }: { shortcut: Shortcut }) {
  const Icon = shortcut.icon
  return (
    <ShortcutLink shortcut={shortcut}>
      <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon className="size-7" strokeWidth={1.5} aria-hidden />
      </span>
      <span className="flex flex-col items-center">
        <span className="text-body font-semibold">{shortcut.label}</span>
        {!shortcut.to && <span className="text-nav text-muted">Em breve</span>}
      </span>
    </ShortcutLink>
  )
}
