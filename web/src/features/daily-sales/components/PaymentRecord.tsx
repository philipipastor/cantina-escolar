import { Banknote, CreditCard, Info, Landmark } from "lucide-react"
import { cn } from "../../../lib/cn"
import { formatCents } from "../../../lib/money"
import { paymentMethodLabels } from "../../clients/paymentMethod"
import type { PaymentMethod } from "../../clients/types"
import type { Entry } from "../../sales/types"
import { RecordCard } from "./RecordCard"

const methodIcons: Record<PaymentMethod, typeof Landmark> = {
  PIX: Landmark,
  CASH: Banknote,
  CARD: CreditCard,
}

// Recebimento ou devolução de crédito do dia: quem, como e quanto.
export function PaymentRecord({ entry }: { entry: Entry }) {
  const isRefund = entry.type === "CREDIT_REFUND"
  const Icon = entry.paymentMethod ? methodIcons[entry.paymentMethod] : Landmark
  const method = entry.paymentMethod ? paymentMethodLabels[entry.paymentMethod] : null
  const badge = entry.isReversed ? "Estornado" : isRefund ? "Devolução" : "Pagamento"

  return (
    <RecordCard entry={entry} badge={{ label: badge, tone: "neutral" }}>
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-brand bg-avatar">
          <Icon className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.75">
          <span className="truncate text-small font-semibold">{entry.client.name}</span>
          {method && (
            <span className="text-mini text-muted">
              {isRefund ? "Devolvido" : "Recebido"} via {method}
            </span>
          )}
        </span>
      </div>
      <hr className="border-line" />
      <div className="flex flex-col gap-2.25">
        <p className="flex items-start gap-1.75 text-mini text-muted">
          <Info className="size-3.75 shrink-0" strokeWidth={1.5} aria-hidden />
          {isRefund ? "Valor devolvido do crédito do cliente." : "Abatido do saldo do cliente."}
        </p>
        <div className="flex items-start justify-between">
          <span className="text-caption leading-[15px] text-muted">
            {isRefund ? "Valor devolvido" : "Valor recebido"}
          </span>
          <span className={cn("text-price font-bold", entry.isReversed && "text-muted line-through")}>
            {formatCents(Math.abs(entry.amountCents))}
          </span>
        </div>
      </div>
    </RecordCard>
  )
}
