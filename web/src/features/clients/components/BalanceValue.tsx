import { cn } from "../../../lib/cn"
import { formatCents } from "../../../lib/money"
import type { Balance } from "../types"

const labels = { DEBT: "Deve", CREDIT: "Crédito", ZERO: "Em dia" }
// Cor de cada situação: dívida em vermelho, crédito em verde, conta em dia em cinza.
export const balanceColors = { DEBT: "text-primary", CREDIT: "text-success", ZERO: "text-muted" }

// Situação de um saldo calculado na tela (negativo é dívida, positivo é crédito), igual à da API.
export function balanceStatus(balanceCents: number): Balance["status"] {
  if (balanceCents < 0) return "DEBT"
  return balanceCents > 0 ? "CREDIT" : "ZERO"
}

// Coluna direita da lista: rótulo e valor na cor do saldo. Nunca mostra dívida como valor negativo.
export function BalanceValue({ balance }: { balance: Balance }) {
  const color = balanceColors[balance.status]
  return (
    <div className="flex flex-col items-end">
      <span className={cn("text-nav font-semibold", color)}>{labels[balance.status]}</span>
      <span className={cn("text-body font-bold", color)}>{formatCents(Math.abs(balance.balanceCents))}</span>
    </div>
  )
}

// Linha curta sob o nome do cliente: "Em aberto: R$ 184,50".
export function BalanceSummary({ balance }: { balance: Balance }) {
  if (balance.status === "DEBT") {
    return (
      <p className="text-caption text-muted">
        Em aberto: <span className="font-semibold text-primary">{formatCents(balance.amountOwedCents)}</span>
      </p>
    )
  }
  if (balance.status === "CREDIT") {
    return (
      <p className="text-caption text-muted">
        Crédito:{" "}
        <span className="font-semibold text-success">{formatCents(balance.availableCreditCents)}</span>
      </p>
    )
  }
  return <p className="text-caption text-muted">Sem saldo em aberto</p>
}
