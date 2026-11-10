import { Link } from "react-router"
import { Card } from "../../../components/ui/Card"
import { cn } from "../../../lib/cn"
import { formatLongDate, formatTime } from "../../../lib/dates"
import { formatCents } from "../../../lib/money"
import { paymentMethodLabels } from "../paymentMethod"
import type { StatementEntry } from "../types"

function consumerLabel(entry: StatementEntry) {
  if (!entry.consumer) return null
  if (entry.consumer.type === "CHILD") return entry.consumer.child?.name ?? null
  return entry.consumer.type === "ACCOUNT_HOLDER" ? "Responsável" : "Não identificado"
}

const typeLabels = {
  PURCHASE: "Compra no fiado",
  PAYMENT: "Pagamento",
  OPENING_BALANCE: "Saldo anterior",
  CREDIT_REFUND: "Devolução de crédito",
  REVERSAL: "Estorno",
}

function EntryHeader({ entry }: { entry: StatementEntry }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-caption font-semibold">{formatLongDate(entry.referenceDate)}</span>
      <span
        className={cn(
          "text-mini font-semibold",
          entry.isReversed
            ? "text-muted line-through"
            : entry.type === "PURCHASE"
              ? "text-primary"
              : "text-ink",
        )}
      >
        {typeLabels[entry.type]}
      </span>
    </div>
  )
}

function PurchaseBody({ entry }: { entry: StatementEntry }) {
  const quantity = entry.items.reduce((total, item) => total + item.quantity, 0)
  const details = [
    formatTime(entry.recordedAt),
    `${quantity} ${quantity === 1 ? "produto" : "produtos"}`,
    consumerLabel(entry),
  ]
    .filter(Boolean)
    .join(" • ")

  return (
    <>
      <p className="text-nav text-muted">{details}</p>
      <ul className="flex flex-col gap-1.5 py-1">
        {entry.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3 text-caption">
            <span className="min-w-0">
              {item.quantity} × {item.description}
            </span>
            <span className="shrink-0">{formatCents(item.subtotalCents)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between border-t border-line pt-2 text-caption font-semibold">
        <span>Total da compra</span>
        <span>{formatCents(-entry.amountCents)}</span>
      </div>
    </>
  )
}

function SimpleBody({ entry }: { entry: StatementEntry }) {
  const title = {
    PAYMENT: "Valor pago",
    OPENING_BALANCE: entry.amountCents < 0 ? "Dívida anterior" : "Crédito anterior",
    CREDIT_REFUND: "Valor devolvido",
    REVERSAL: "Valor estornado",
    PURCHASE: "",
  }[entry.type]

  const details = [
    formatTime(entry.recordedAt),
    entry.paymentMethod &&
      `${entry.type === "CREDIT_REFUND" ? "Devolvido" : "Recebido"} via ${paymentMethodLabels[entry.paymentMethod]}`,
  ]
    .filter(Boolean)
    .join(" • ")

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-small font-semibold">{title}</span>
        <span className="text-small font-bold">{formatCents(Math.abs(entry.amountCents))}</span>
      </div>
      <p className="text-nav text-muted">{details}</p>
      {entry.type === "PAYMENT" && <p className="text-nav text-muted">Abatido do saldo do cliente.</p>}
      {entry.reason && <p className="text-nav text-muted">Motivo: {entry.reason}</p>}
    </>
  )
}

// Só estes tipos têm tela de detalhes; saldo anterior e estornos ficam apenas no extrato.
const typesWithDetails = new Set<StatementEntry["type"]>(["PURCHASE", "PAYMENT", "CREDIT_REFUND"])

export function EntryCard({ entry }: { entry: StatementEntry }) {
  const card = (
    <Card className={cn("flex flex-col gap-1.5 p-3.5", entry.isReversed && "opacity-60")}>
      <EntryHeader entry={entry} />
      {entry.type === "PURCHASE" ? <PurchaseBody entry={entry} /> : <SimpleBody entry={entry} />}
      {entry.isReversed && <p className="text-nav font-medium text-primary">Lançamento estornado</p>}
    </Card>
  )

  return (
    <li>
      {typesWithDetails.has(entry.type) ? (
        <Link to={`/lancamentos/${entry.id}`} className="block rounded-card transition hover:opacity-80">
          {card}
        </Link>
      ) : (
        card
      )}
    </li>
  )
}
