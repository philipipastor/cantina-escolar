import { AppHeader } from "../components/layout/AppHeader"
import { PageContainer } from "../components/layout/PageContainer"
import { PageHeader } from "../components/layout/PageHeader"
import { Button } from "../components/ui/Button"
import { useAuth } from "../features/auth/AuthContext"

// TEMPORÁRIA: só para testar o login até o Dashboard ficar pronto. Será removida na etapa 7.
export function TemporaryHome() {
  const { user, signOut } = useAuth()
  return (
    <>
      <AppHeader />
      <PageContainer>
        <PageHeader title={`Olá, ${user?.name}!`} subtitle="O Dashboard entra aqui nas próximas etapas." />
        <div className="px-5">
          <Button variant="outline" onClick={signOut}>
            Sair
          </Button>
        </div>
      </PageContainer>
    </>
  )
}
