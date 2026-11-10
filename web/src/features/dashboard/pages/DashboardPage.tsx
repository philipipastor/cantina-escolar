import { PageContainer } from "../../../components/layout/PageContainer"
import { firstName } from "../../../lib/text"
import { useAuth } from "../../auth/AuthContext"
import { UserMenu } from "../../auth/components/UserMenu"
import { useCanteen, useCurrentCanteen } from "../../canteens/CanteenContext"
import { AccountCard } from "../components/AccountCard"
import { CanteenSelector } from "../components/CanteenSelector"
import { DaySummary } from "../components/DaySummary"
import { ShortcutTile } from "../components/ShortcutCard"
import { shortcutsFor } from "../shortcuts"

// Tela inicial de admin e funcionário. Muda só nos atalhos, conforme o papel.
export function DashboardPage() {
  const { user } = useAuth()
  const { canteens, selectCanteen } = useCanteen()
  const canteen = useCurrentCanteen()
  if (!user) return null

  const shortcuts = shortcutsFor(user.role)
  // Cantinas inativas não recebem lançamentos, então não aparecem para escolha.
  const options = canteens.filter((item) => item.isActive)

  return (
    <PageContainer>
      {/* Cabeçalho vermelho do Figma: saudação, cantina, avatar e os números do dia. */}
      <header className="flex flex-col gap-5 rounded-b-3xl bg-primary px-5 pt-3 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <h1 className="truncate text-greeting font-bold text-white">Olá, {firstName(user.name)}!</h1>
            <CanteenSelector canteen={canteen} options={options} onSelect={selectCanteen} />
          </div>
          <UserMenu />
        </div>
        {/* A chave refaz a busca do zero ao trocar de cantina, sem mostrar números da anterior. */}
        <DaySummary key={canteen.id} canteenId={canteen.id} />
      </header>

      <div className="flex flex-col gap-6.5 px-5 pt-5 pb-6">
        <nav aria-label="Atalhos" className="grid grid-cols-2 gap-2.5">
          {shortcuts.map((shortcut) => (
            <ShortcutTile key={shortcut.label} shortcut={shortcut} />
          ))}
        </nav>

        <AccountCard canteenName={canteen.name} />
      </div>
    </PageContainer>
  )
}
