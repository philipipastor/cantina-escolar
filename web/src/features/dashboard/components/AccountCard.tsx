import { LogOut, Store } from "lucide-react"
import { useAuth } from "../../auth/AuthContext"

// Faixa rosa do fim do Dashboard: identifica a cantina e oferece a saída do sistema.
export function AccountCard({ canteenName }: { canteenName: string }) {
  const { signOut } = useAuth()

  return (
    <div className="flex items-center gap-2.5 rounded-card bg-primary-soft p-3.5">
      <Store className="size-6.5 shrink-0 text-primary" strokeWidth={1.5} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <p className="truncate text-small font-semibold">{canteenName}</p>
        <p className="text-nav text-muted">Sistema de vendas e fiados</p>
      </div>
      <button
        type="button"
        onClick={signOut}
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-field bg-primary px-3 text-small leading-4 font-semibold text-white transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <LogOut className="size-4.5" strokeWidth={1.5} aria-hidden />
        Sair
      </button>
    </div>
  )
}
