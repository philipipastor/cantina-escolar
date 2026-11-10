import { Outlet, useMatch } from "react-router"
import { UserMenu } from "../../features/auth/components/UserMenu"
import { CanteenProvider } from "../../features/canteens/CanteenContext"
import { AppHeader } from "./AppHeader"
import { BottomNav } from "./BottomNav"

// Estrutura das telas com menu: cabeçalho, conteúdo e menu fixo. O espaço inferior evita que ele cubra o conteúdo.
export function AppLayout() {
  // No Figma, a devolução de crédito é uma tela de foco: sem o menu, a pessoa conclui ou cancela.
  const isFocused = useMatch("/clientes/:id/devolver-credito")
  // O Dashboard tem o próprio cabeçalho vermelho, com o avatar dentro dele.
  const isDashboard = useMatch("/")

  return (
    <div className={isFocused ? "pb-8" : "pb-24"}>
      {!isDashboard && <AppHeader action={<UserMenu />} />}
      <CanteenProvider>
        <Outlet />
      </CanteenProvider>
      {!isFocused && <BottomNav />}
    </div>
  )
}
