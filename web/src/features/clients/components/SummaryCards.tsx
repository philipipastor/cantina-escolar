import { useCallback } from "react"
import { BadgeDollarSign, ShoppingCart, type LucideIcon } from "lucide-react"
import { useApiData } from "../../../hooks/useApiData"
import { cn } from "../../../lib/cn"
import { formatCents } from "../../../lib/money"
import { fetchCanteenSummary } from "../api"

type StatCardProps = {
  tone: "debt" | "credit"
  icon: LucideIcon
  label: string
  value: string
  caption: string
}

function StatCard({ tone, icon: Icon, label, value, caption }: StatCardProps) {
  const isDebt = tone === "debt"
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-card border p-3.5",
        isDebt ? "border-primary-line bg-primary-soft" : "border-success-line bg-success-soft",
      )}
    >
      <div className={cn("flex items-center gap-1.5", isDebt ? "text-primary" : "text-success")}>
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full text-white",
            isDebt ? "bg-primary" : "bg-success",
          )}
        >
          <Icon className="size-3" aria-hidden />
        </span>
        <span className="text-mini font-semibold">{label}</span>
      </div>
      <p className={cn("text-stat font-bold", isDebt ? "text-primary" : "text-success")}>{value}</p>
      <p className="text-nav text-muted">{caption}</p>
    </div>
  )
}

const accounts = (count: number, description: string) =>
  `${count} ${count === 1 ? "cliente" : "clientes"} ${description}`

// Dívidas e créditos ficam em cartões separados, sem compensar uma conta com outra.
export function SummaryCards({ canteenId }: { canteenId: string }) {
  const load = useCallback(() => fetchCanteenSummary(canteenId), [canteenId])
  const { data } = useApiData(load)

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <StatCard
        tone="debt"
        icon={ShoppingCart}
        label="A receber"
        value={formatCents(data?.receivableCents ?? 0)}
        caption={accounts(data?.debtorAccounts ?? 0, "com dívida")}
      />
      <StatCard
        tone="credit"
        icon={BadgeDollarSign}
        label="Créditos"
        value={formatCents(data?.availableCreditCents ?? 0)}
        caption={accounts(data?.creditAccounts ?? 0, "com crédito")}
      />
    </div>
  )
}
