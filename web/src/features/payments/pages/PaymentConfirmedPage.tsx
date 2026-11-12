import { Navigate, useLocation, useNavigate } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { Avatar } from "../../../components/ui/Avatar"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { SendReceiptButton } from "../../../components/ui/SendReceiptButton"
import { SuccessHeader } from "../../../components/ui/SuccessHeader"
import { formatNumericDate } from "../../../lib/dates"
import { formatCents } from "../../../lib/money"
import { formatBalanceText, ReceiptBalance, ReceiptRow } from "../../clients/components/ReceiptParts"
import { paymentMethodLabels } from "../../clients/paymentMethod"
import { preparePaymentReceipt } from "../paymentReceiptMessage"
import type { PaymentConfirmation } from "../types"

export function PaymentConfirmedPage() {
  const navigate = useNavigate()
  const payment = useLocation().state as PaymentConfirmation | null

  // Sem os dados do recebimento (link aberto direto), não há o que confirmar.
  if (!payment) return <Navigate to="/pagamento" replace />

  return (
    <PageContainer>
      <SuccessHeader
        title={`Recebimento de ${formatCents(payment.amountCents)} confirmado!`}
        subtitle="Pagamento recebido. Conta atualizada."
      />
      <div className="flex flex-col gap-3.5 px-5">
        <Card className="flex flex-col gap-3 p-3.5">
          <div className="flex items-center gap-3 border-b border-line pb-3">
            <Avatar name={payment.clientName} variant="accent" className="size-10" />
            <div className="min-w-0">
              <p className="text-nav text-muted">Cliente</p>
              <p className="truncate text-small font-semibold">{payment.clientName}</p>
            </div>
          </div>
          <ReceiptRow label="Saldo anterior" value={formatBalanceText(payment.balanceBeforeCents)} />
          <ReceiptRow label="Valor do pagamento" value={formatCents(payment.amountCents)} strong />
          <ReceiptRow label="Forma de pagamento" value={paymentMethodLabels[payment.paymentMethod]} />
          <ReceiptRow label="Data" value={formatNumericDate(payment.referenceDate)} />
          <ReceiptBalance balance={payment.balance} clientName={payment.clientName} />
        </Card>

        {/* Abre o WhatsApp do cliente com o comprovante deste recebimento; a pessoa revisa e envia. */}
        <SendReceiptButton
          prepare={() =>
            preparePaymentReceipt(payment, {
              name: payment.clientName,
              phone: payment.phone,
              balance: payment.balance,
            })
          }
        />
        <Button variant="outline" onClick={() => navigate("/pagamento", { replace: true })}>
          Registrar novo recebimento
        </Button>
        <p className="text-center text-nav text-muted">Compartilhe o comprovante com o cliente.</p>
      </div>
    </PageContainer>
  )
}
