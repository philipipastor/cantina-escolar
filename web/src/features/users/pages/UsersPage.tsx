import { UserRoundPlus } from "lucide-react"
import { useLocation, useNavigate } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { Alert } from "../../../components/ui/Alert"
import { Button } from "../../../components/ui/Button"
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States"
import { useApiData } from "../../../hooks/useApiData"
import { useAuth } from "../../auth/AuthContext"
import { useCanteen } from "../../canteens/CanteenContext"
import { fetchUsers } from "../api"
import { UserCard } from "../components/UserCard"

export function UsersPage() {
  const navigate = useNavigate()
  const notice = useLocation().state as { success?: string } | null
  const { user: currentUser } = useAuth()
  const { canteens } = useCanteen()
  const { data: users, error, reload } = useApiData(fetchUsers)

  const canteenName = (canteenId: string | null) =>
    canteenId
      ? (canteens.find((canteen) => canteen.id === canteenId)?.name ?? "Cantina")
      : "Todas as cantinas"
  // Ativos primeiro; dentro de cada grupo, a API já manda em ordem alfabética.
  const sorted = users ? [...users].sort((a, b) => Number(b.isActive) - Number(a.isActive)) : []

  return (
    <PageContainer>
      <PageHeader
        title="Gerenciar usuários"
        subtitle="Controle quem pode acessar o sistema."
        back={{ to: "/", label: "Início" }}
      />
      <div className="flex flex-col gap-4.5 px-5 pb-6">
        {notice?.success && <Alert variant="success">{notice.success}</Alert>}

        <Button onClick={() => navigate("/usuarios/novo")}>
          <UserRoundPlus className="size-4.5" strokeWidth={1.5} aria-hidden />+ Criar novo usuário
        </Button>

        <section aria-labelledby="team-title" className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 id="team-title" className="text-section font-semibold">
              Equipe e acessos
            </h2>
            {users && (
              <span className="text-mini leading-[13px] font-medium text-muted">
                {users.length} {users.length === 1 ? "usuário" : "usuários"}
              </span>
            )}
          </div>

          {error && !users ? (
            <ErrorState message={error.message} onRetry={reload} />
          ) : !users ? (
            <LoadingState label="Carregando usuários" />
          ) : sorted.length === 0 ? (
            <EmptyState title="Nenhum usuário cadastrado" />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {sorted.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  canteenName={canteenName(user.canteenId)}
                  isCurrentUser={user.id === currentUser?.id}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageContainer>
  )
}
