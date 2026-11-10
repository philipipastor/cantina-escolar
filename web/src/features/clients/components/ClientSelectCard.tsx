import { ChevronDown } from "lucide-react"
import { Avatar } from "../../../components/ui/Avatar"
import { Card } from "../../../components/ui/Card"
import type { Client } from "../types"
import { BalanceSummary } from "./BalanceValue"
import { ChildChips } from "./ChildChips"

type ClientSelectCardProps = {
  client: Client | null
  showChildren?: boolean
  onClick: () => void
}

// Cartão que mostra o cliente escolhido e abre a lista para escolher outro.
export function ClientSelectCard({ client, showChildren, onClick }: ClientSelectCardProps) {
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      <Card className="flex items-center gap-3 rounded-field p-3.5 transition hover:bg-page">
        {client ? (
          <>
            <Avatar name={client.name} variant="accent" className="size-10.5 text-body" />
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="block truncate text-body font-semibold">{client.name}</span>
              <BalanceSummary balance={client.balance} />
              {showChildren && <ChildChips items={client.children} />}
            </span>
          </>
        ) : (
          <span className="flex-1 py-2 text-small text-muted">Selecionar cliente</span>
        )}
        <ChevronDown className="size-4.5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
      </Card>
    </button>
  )
}
