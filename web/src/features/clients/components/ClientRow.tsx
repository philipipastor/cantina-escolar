import { ChevronRight } from "lucide-react"
import { Link } from "react-router"
import { Avatar } from "../../../components/ui/Avatar"
import { formatDayMonth } from "../../../lib/dates"
import { joinNames } from "../../../lib/text"
import type { ClientListItem } from "../types"
import { BalanceValue } from "./BalanceValue"

export function ClientRow({ client }: { client: ClientListItem }) {
  // Linha dos filhos, como no Figma ("Pedro e Ana"). Sem filhos ativos, a linha não aparece.
  const children = client.children.filter((child) => child.isActive).map((child) => child.name)

  return (
    <li>
      <Link
        to={`/clientes/${client.id}`}
        className="flex items-center gap-2.5 p-3.5 transition hover:bg-page focus-visible:bg-page focus-visible:outline-none"
      >
        <Avatar name={client.name} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-small font-semibold">{client.name}</p>
          {children.length > 0 && <p className="truncate text-nav text-muted">{joinNames(children)}</p>}
          <p className="text-nav text-muted">
            {client.lastPurchaseDate
              ? `Última compra em ${formatDayMonth(client.lastPurchaseDate)}`
              : "Nenhuma compra ainda"}
          </p>
        </div>
        <BalanceValue balance={client.balance} />
        <ChevronRight className="size-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
      </Link>
    </li>
  )
}
