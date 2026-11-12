import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { Card } from "../../../components/ui/Card"
import { SendReceiptButton } from "../../../components/ui/SendReceiptButton"
import { formatCents } from "../../../lib/money"
import { paymentMethodLabels } from "../../clients/paymentMethod"
import { useReceiptClient } from "../../clients/useReceiptClient"
import { BackToStatement } from "../../entries/components/BackToStatement"
import { EntryOverviewCard } from "../../entries/components/EntryOverviewCard"
import { ReversalSection, type RedoTexts } from "../../entries/components/ReversalSection"
import type { Entry } from "../../sales/types"
import { preparePaymentReceipt } from "../paymentReceiptMessage"

// Recebimento e devolução têm a mesma forma (valor e meio de pagamento); só os textos mudam.
function textsFor(entry: Entry) {
  if (entry.type === "CREDIT_REFUND") {
    return {
      title: "Detalhes da devolução",
      status: { confirmed: "Devolução confirmada", reversed: "Devolução estornada" },
      amountLabel: "Valor devolvido",
      methodPrefix: "Devolvido via",
      reversalNote: "O valor volta como crédito para o cliente, e a devolução continua no extrato.",
      redo: {
        url: `/clientes/${entry.client.id}/devolver-credito?refazer=${entry.id}`,
        label: "Refazer devolução",
        doneLabel: "Ver a devolução refeita",
        hint: "Após o estorno, refazer a devolução",
      } satisfies RedoTexts,
    }
  }
  return {
    title: "Detalhes do recebimento",
    status: { confirmed: "Recebimento confirmado", reversed: "Recebimento estornado" },
    amountLabel: "Valor recebido",
    methodPrefix: "Recebido via",
    reversalNote: "O valor deixa de ser abatido do saldo do cliente, e o recebimento continua no extrato.",
    redo: {
      url: `/pagamento?refazer=${entry.id}`,
      label: "Refazer recebimento",
      doneLabel: "Ver o recebimento refeito",
      hint: "Após o estorno, refazer o recebimento",
    } satisfies RedoTexts,
  }
}

// Comprovante deste recebimento com o saldo de agora. Componente à parte para só carregar o cliente
// nos recebimentos (a devolução não tem comprovante).
function PaymentReceiptButton({ entry }: { entry: Entry }) {
  const { client, isLoading, loadFailed } = useReceiptClient(entry)
  const { paymentMethod } = entry
  const prepare =
    client && paymentMethod
      ? () => preparePaymentReceipt({ amountCents: entry.amountCents, paymentMethod }, client)
      : null
  return <SendReceiptButton prepare={prepare} isLoading={isLoading} loadFailed={loadFailed} />
}

export function MoneyEntryDetails({ entry, onReversed }: { entry: Entry; onReversed: () => void }) {
  const texts = textsFor(entry)
  const method = entry.paymentMethod && `${texts.methodPrefix} ${paymentMethodLabels[entry.paymentMethod]}`

  return (
    <PageContainer>
      <PageHeader title={texts.title} subtitle="Veja todas as informações do lançamento." />
      <div className="flex flex-col gap-3.5 px-5">
        <EntryOverviewCard entry={entry} status={texts.status} detail={method} />

        <Card className="flex items-center justify-between p-3.5">
          <span className="text-small">{texts.amountLabel}</span>
          <span className="text-section font-bold">{formatCents(Math.abs(entry.amountCents))}</span>
        </Card>

        {entry.type === "PAYMENT" && <PaymentReceiptButton entry={entry} />}

        <ReversalSection
          entry={entry}
          reversalNote={texts.reversalNote}
          redo={texts.redo}
          onReversed={onReversed}
        />

        <BackToStatement clientId={entry.client.id} />
      </div>
    </PageContainer>
  )
}
