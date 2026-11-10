import { Send } from "lucide-react"
import { Navigate, useLocation, useNavigate } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { Avatar } from "../../../components/ui/Avatar"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { SuccessHeader } from "../../../components/ui/SuccessHeader"
import { formatNumericDate } from "../../../lib/dates"
import { formatCents } from "../../../lib/money"
import { formatBalanceText, ReceiptBalance, ReceiptRow } from "../../clients/components/ReceiptParts"
import type { SaleConfirmation } from "../types"

export function SaleConfirmedPage() {
  const navigate = useNavigate()
  const sale = useLocation().state as SaleConfirmation | null

  // Sem os dados da venda (link aberto direto), não há o que confirmar.
  if (!sale) return <Navigate to="/venda" replace />

  return (
    <PageContainer>
      <SuccessHeader
        title="Venda registrada com sucesso"
        subtitle="Tudo certo! A venda foi anotada na caderneta."
      />
      <div className="flex flex-col gap-3.5 px-5">
        <Card className="flex flex-col gap-3 p-3.5">
          <div className="flex items-center gap-3 border-b border-line pb-3">
            <Avatar name={sale.clientName} variant="accent" className="size-10" />
            <div className="min-w-0">
              <p className="truncate text-small font-semibold">{sale.clientName}</p>
              <p className="text-nav text-muted">Quem consumiu: {sale.consumerLabel}</p>
            </div>
          </div>
          <ReceiptRow label="Saldo anterior" value={formatBalanceText(sale.balanceBeforeCents)} />
          <ReceiptRow label="Valor da venda" value={formatCents(sale.totalCents)} strong />
          <ReceiptRow label="Data" value={formatNumericDate(sale.referenceDate)} />
          <ReceiptBalance balance={sale.balance} clientName={sale.clientName} tinted />
        </Card>

        {/* O envio por WhatsApp é de uma etapa futura; por enquanto, o botão fica sem ação. */}
        <Button aria-label="Enviar comprovante (em breve)">
          <Send className="size-4.5" strokeWidth={1.5} aria-hidden />
          Enviar Comprovante
        </Button>
        <Button variant="outline" onClick={() => navigate("/venda", { replace: true })}>
          Registrar nova venda
        </Button>
        <p className="text-center text-nav text-muted">Compartilhe o comprovante com o cliente.</p>
      </div>
    </PageContainer>
  )
}
