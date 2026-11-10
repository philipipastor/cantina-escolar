import { cn } from "../../../lib/cn"
import { formatCents } from "../../../lib/money"
import { firstName } from "../../../lib/text"
import type { Balance } from "../types"

// Partes em comum dos comprovantes de venda e de recebimento.

export function ReceiptRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-caption">
      <span className="text-muted">{label}</span>
      <span className={strong ? "font-semibold" : undefined}>{value}</span>
    </div>
  )
}

// Saldo por extenso: dívida aparece só como valor; crédito é sempre identificado.
export function formatBalanceText(cents: number) {
  return cents > 0 ? `Crédito de ${formatCents(cents)}` : formatCents(Math.abs(cents))
}

function balanceCaption(balance: Balance, clientName: string) {
  const name = firstName(clientName)
  if (balance.status === "DEBT") return `Valor em aberto na conta de ${name}.`
  if (balance.status === "CREDIT") return `Crédito disponível na conta de ${name}.`
  return `A conta de ${name} está em dia.`
}

// Fundo, borda e texto do bloco quando ele toma a cor da situação. Conta em dia continua cinza.
const tintedStyles = {
  DEBT: "border-primary-line bg-primary-soft text-primary",
  CREDIT: "border-success-line bg-success-soft text-success",
  ZERO: "border-transparent bg-page",
}

type ReceiptBalanceProps = {
  balance: Balance
  clientName: string
  // Pinta o bloco inteiro: vermelho para dívida, verde para crédito.
  tinted?: boolean
}

export function ReceiptBalance({ balance, clientName, tinted }: ReceiptBalanceProps) {
  const isColored = tinted && balance.status !== "ZERO"
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-field border p-3.5",
        tinted ? tintedStyles[balance.status] : "border-transparent bg-page",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-small font-semibold">Saldo atual</span>
        <span className="text-amount font-bold">{formatCents(Math.abs(balance.balanceCents))}</span>
      </div>
      <p className={cn("text-nav", !isColored && "text-muted")}>{balanceCaption(balance, clientName)}</p>
    </div>
  )
}
