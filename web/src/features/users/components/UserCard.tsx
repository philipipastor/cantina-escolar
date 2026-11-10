import { KeyRound, Pencil } from "lucide-react"
import { Link } from "react-router"
import { Card } from "../../../components/ui/Card"
import { cn } from "../../../lib/cn"
import type { User } from "../types"

const badgeClass = "rounded-full px-2.25 py-1 text-mini leading-[1.3] font-medium"
const actionClass =
  "flex items-center gap-1.5 py-1 text-caption leading-[15px] font-medium text-muted hover:text-ink"

type UserCardProps = { user: User; canteenName: string; isCurrentUser: boolean }

// Cartão da equipe: inicial, nome, papel, onde trabalha e as ações de editar e redefinir senha.
export function UserCard({ user, canteenName, isCurrentUser }: UserCardProps) {
  const isAdmin = user.role === "ADMIN"
  // Redefinir a própria senha por aqui desconectaria este aparelho; "Trocar senha" mantém a sessão.
  const passwordUrl = isCurrentUser ? "/trocar-senha" : `/usuarios/${user.id}/senha`

  return (
    <li>
      <Card className={cn("flex flex-col gap-3 p-3.5", !user.isActive && "opacity-60")}>
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-avatar text-body leading-[17px] font-semibold text-muted"
          >
            {user.name.trim().charAt(0).toUpperCase()}
          </span>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <p className="max-w-full truncate text-small font-semibold">{user.name}</p>
            <div className="flex gap-1.5">
              <span
                className={cn(badgeClass, isAdmin ? "bg-primary-soft text-primary" : "bg-avatar text-muted")}
              >
                {isAdmin ? "Administrador" : "Funcionário"}
              </span>
              {!user.isActive && <span className={cn(badgeClass, "bg-avatar text-muted")}>Inativo</span>}
            </div>
            <p className="text-mini text-muted">{canteenName}</p>
          </div>
        </div>
        <hr className="border-line" />
        <div className="flex items-center gap-5">
          <Link to={`/usuarios/${user.id}/editar`} className={actionClass}>
            <Pencil className="size-3.75" strokeWidth={1.5} aria-hidden />
            Editar
          </Link>
          <Link to={passwordUrl} className={actionClass}>
            <KeyRound className="size-3.75" strokeWidth={1.5} aria-hidden />
            Redefinir senha
          </Link>
        </div>
      </Card>
    </li>
  )
}
