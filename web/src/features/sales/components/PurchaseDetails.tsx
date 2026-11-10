import { Send } from "lucide-react"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { formatCents } from "../../../lib/money"
import { BackToStatement } from "../../entries/components/BackToStatement"
import { EntryOverviewCard } from "../../entries/components/EntryOverviewCard"
import { ReversalSection } from "../../entries/components/ReversalSection"
import { ProductThumb } from "../../products/components/ProductThumb"
import { consumerTypeLabel } from "../consumer"
import type { Entry } from "../types"

function consumptionText(entry: Entry) {
  if (!entry.consumer) return null
  if (entry.consumer.type === "CHILD") return `Consumo de ${entry.consumer.child?.name}`
  return `Consumo: ${consumerTypeLabel(entry.consumer.type)}`
}

export function PurchaseDetails({ entry, onReversed }: { entry: Entry; onReversed: () => void }) {
  return (
    <PageContainer>
      <PageHeader title="Detalhes da compra" subtitle="Veja todas as informações do lançamento." />
      <div className="flex flex-col gap-3.5 px-5">
        <EntryOverviewCard
          entry={entry}
          status={{ confirmed: "Compra confirmada", reversed: "Compra estornada" }}
          detail={consumptionText(entry)}
        />

        <section aria-labelledby="items-title" className="flex flex-col gap-2">
          <h2 id="items-title" className="text-small font-semibold">
            Produtos
          </h2>
          <Card className="flex flex-col">
            <ul className="divide-y divide-line">
              {entry.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 p-3.5">
                  <ProductThumb />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small font-semibold">
                      {item.quantity} × {item.description}
                    </p>
                    <p className="text-nav text-muted">Unitário: {formatCents(item.unitPriceCents)}</p>
                  </div>
                  <span className="text-small font-semibold">{formatCents(item.subtotalCents)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-line p-3.5">
              <span className="text-small">Total da compra</span>
              <span className="text-section font-bold">{formatCents(-entry.amountCents)}</span>
            </div>
          </Card>
        </section>

        {/* O envio por WhatsApp é de uma etapa futura; por enquanto, o botão fica sem ação. */}
        <Button aria-label="Enviar comprovante (em breve)">
          <Send className="size-4.5" strokeWidth={1.5} aria-hidden />
          Enviar Comprovante
        </Button>

        <ReversalSection
          entry={entry}
          reversalNote="O valor volta para a conta do cliente, e a compra continua no extrato."
          redo={{
            url: `/venda?refazer=${entry.id}`,
            label: "Refazer venda",
            doneLabel: "Ver a venda refeita",
            hint: "Após o estorno, refazer a venda",
          }}
          onReversed={onReversed}
        />

        <BackToStatement clientId={entry.client.id} />
      </div>
    </PageContainer>
  )
}
