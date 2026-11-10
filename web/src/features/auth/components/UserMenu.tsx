import { useEffect, useRef, useState } from "react"
import { KeyRound, LogOut, UserRound } from "lucide-react"
import { Link } from "react-router"
import { useAuth } from "../AuthContext"

const itemClass =
  "flex h-11 w-full items-center gap-2.5 rounded-lg px-3 text-small font-medium hover:bg-page focus-visible:bg-page focus-visible:outline-none"

// Avatar do cabeçalho: ao tocar, abre um menu pequeno perto dele, com "Redefinir senha" e "Sair".
export function UserMenu() {
  const { signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fecha ao tocar fora ou apertar Esc, como os menus nativos.
  useEffect(() => {
    if (!isOpen) return

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false)
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Menu da conta"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <UserRound className="size-6.5" strokeWidth={1.5} aria-hidden />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-1 w-48 rounded-field border border-line bg-surface p-1"
        >
          <Link role="menuitem" to="/trocar-senha" onClick={() => setIsOpen(false)} className={itemClass}>
            <KeyRound className="size-4.5 text-muted" strokeWidth={1.5} aria-hidden />
            Redefinir senha
          </Link>
          <button role="menuitem" type="button" onClick={signOut} className={`${itemClass} text-primary`}>
            <LogOut className="size-4.5" strokeWidth={1.5} aria-hidden />
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
