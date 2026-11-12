import { useState } from "react"
import { Check, Plus } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { Alert } from "../../../components/ui/Alert"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { DateSelect } from "../../../components/ui/DateSelect"
import { FieldError } from "../../../components/ui/FieldError"
import { useIdempotencyKey } from "../../../hooks/useIdempotencyKey"
import { ApiError } from "../../../lib/api"
import { cn } from "../../../lib/cn"
import { formatNumericDate, todayIso } from "../../../lib/dates"
import { formatCents } from "../../../lib/money"
import { firstName } from "../../../lib/text"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { fetchClient } from "../../clients/api"
import { balanceColors, balanceStatus } from "../../clients/components/BalanceValue"
import { ClientPickerSheet } from "../../clients/components/ClientPickerSheet"
import { ClientSelectCard } from "../../clients/components/ClientSelectCard"
import { createPurchase } from "../api"
import type { SaleConfirmation } from "../types"
import { useSaleDraft, type SaleDraftInitial } from "../useSaleDraft"
import { ConsumerPicker } from "./ConsumerPicker"
import { ProductPickerSheet } from "./ProductPickerSheet"
import { SaleItemRow } from "./SaleItemRow"

// Linha abaixo do botão: mostra como a conta vai ficar antes de registrar.
// O valor fica vermelho se o cliente vai dever e verde se vai sobrar crédito.
function BalanceAfterText({
  clientName,
  balanceAfterCents,
}: {
  clientName: string
  balanceAfterCents: number
}) {
  const name = firstName(clientName)
  const status = balanceStatus(balanceAfterCents)
  if (status === "ZERO") return <>Conta de {name} fica em dia</>
  return (
    <>
      {status === "DEBT" ? "Saldo" : "Crédito"} de {name} após registrar:{" "}
      <span className={cn("font-semibold", balanceColors[status])}>
        {formatCents(Math.abs(balanceAfterCents))}
      </span>
    </>
  )
}

export function SaleForm({ initial }: { initial: SaleDraftInitial }) {
  const canteen = useCurrentCanteen()
  const navigate = useNavigate()
  const draft = useSaleDraft(initial)
  const keyFor = useIdempotencyKey()

  const [openSheet, setOpenSheet] = useState<"client" | "product" | null>(null)
  // Os erros só aparecem depois da primeira tentativa e somem sozinhos conforme os campos são preenchidos.
  const [showErrors, setShowErrors] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { client, items } = draft
  const today = todayIso()
  const errors = showErrors ? draft.validate() : null

  async function submit(confirmDuplicate: boolean) {
    setShowErrors(true)
    const input = draft.toPurchaseInput()
    if (!input || !client) return

    setFormError(null)
    setIsDuplicate(false)
    setIsSubmitting(true)
    try {
      const result = await createPurchase(canteen.id, {
        ...input,
        idempotencyKey: keyFor(input),
        expectedBalanceCents: client.balance.balanceCents,
        confirmDuplicate,
      })
      const confirmation: SaleConfirmation = {
        clientName: client.name,
        consumerLabel: draft.consumerLabel ?? "",
        totalCents: -result.entry.amountCents,
        referenceDate: result.entry.referenceDate,
        balanceBeforeCents: result.effect?.balanceBefore.balanceCents ?? client.balance.balanceCents,
        balance: result.balance,
        entry: result.entry,
        phone: client.phone,
      }
      navigate("/venda/confirmada", { replace: true, state: confirmation })
    } catch (error) {
      const failure = error instanceof ApiError ? error : null
      if (failure?.code === "POSSIBLE_DUPLICATE") {
        setIsDuplicate(true)
      } else {
        setFormError(failure?.message ?? "Não foi possível registrar a venda.")
      }
      setIsSubmitting(false)
      // Outra pessoa lançou nesta conta: atualiza o saldo na tela para conferir antes de tentar de novo.
      if (failure?.code === "BALANCE_CHANGED") {
        fetchClient(canteen.id, client.id)
          .then(draft.setClient)
          .catch(() => setFormError("O saldo mudou. Recarregue a página antes de registrar a venda."))
      }
    }
  }

  return (
    <div className="flex flex-col gap-4 px-5">
      {initial.redoing && (
        <Alert variant="note">
          Refazendo uma venda estornada. Os itens originais mantêm o preço da época.
        </Alert>
      )}

      <DateSelect label="Data da venda" value={draft.date} max={today} onChange={draft.setDate} />
      {draft.date !== today && (
        <Alert variant="note">
          Esta venda será lançada em {formatNumericDate(draft.date)}, não na data de hoje.
        </Alert>
      )}

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-small font-semibold">Cliente</h2>
          <Link
            to="/clientes/novo"
            state={{ returnToSale: true }}
            className="text-mini font-semibold text-primary hover:underline"
          >
            Novo cliente
          </Link>
        </div>
        <ClientSelectCard client={client} onClick={() => setOpenSheet("client")} />
        <FieldError message={errors?.client} />
      </section>

      {client && (
        <section className="flex flex-col gap-2">
          <h2 className="text-small font-semibold">Quem consumiu?</h2>
          <ConsumerPicker options={draft.options} value={draft.consumer} onChange={draft.setConsumer} />
          <FieldError message={errors?.consumer} />
        </section>
      )}

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-small font-semibold">Produtos</h2>
          {items.length > 0 && (
            <span className="text-mini font-semibold text-primary">
              {items.length} {items.length === 1 ? "selecionado" : "selecionados"}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <SaleItemRow
                  key={item.productId}
                  item={item}
                  onQuantityChange={(quantity) => draft.setQuantity(item.productId, quantity)}
                  onRemove={() => draft.removeItem(item.productId)}
                />
              ))}
            </ul>
          </Card>
        )}
        <button
          type="button"
          onClick={() => setOpenSheet("product")}
          className="flex h-10 items-center justify-center gap-2 text-small font-semibold text-primary hover:underline"
        >
          <Plus className="size-4" strokeWidth={1.5} aria-hidden />
          Adicionar produto
        </button>
        <FieldError message={errors?.items} />
      </section>

      <Card className="flex items-center justify-between gap-3 p-3.5">
        <div>
          <p className="text-small font-semibold">Total da venda</p>
          <p className="text-nav text-muted">
            {draft.units} {draft.units === 1 ? "unidade" : "unidades"}
          </p>
        </div>
        <span className="text-amount font-bold">{formatCents(draft.totalCents)}</span>
      </Card>

      {formError && <Alert>{formError}</Alert>}

      {isDuplicate ? (
        <div className="flex flex-col gap-3">
          <Alert>Já existe uma compra igual nesta conta e nesta data. Deseja lançar mesmo assim?</Alert>
          <Button loading={isSubmitting} onClick={() => submit(true)}>
            Lançar mesmo assim
          </Button>
          <Button variant="outline" disabled={isSubmitting} onClick={() => setIsDuplicate(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button loading={isSubmitting} onClick={() => submit(false)}>
          <Check className="size-4.5" strokeWidth={1.5} aria-hidden />
          Registrar venda
        </Button>
      )}

      {client && items.length > 0 && (
        <p className="text-center text-nav text-muted">
          {draft.consumerLabel && `Quem consumiu: ${draft.consumerLabel} • `}
          <BalanceAfterText
            clientName={client.name}
            balanceAfterCents={client.balance.balanceCents - draft.totalCents}
          />
        </p>
      )}

      {openSheet === "client" && (
        <ClientPickerSheet
          canteenId={canteen.id}
          onClose={() => setOpenSheet(null)}
          onSelect={(selected) => {
            draft.selectClient(selected)
            setOpenSheet(null)
          }}
        />
      )}
      {openSheet === "product" && (
        <ProductPickerSheet
          canteenId={canteen.id}
          onClose={() => setOpenSheet(null)}
          onSelect={(product) => {
            draft.addProduct(product)
            setOpenSheet(null)
          }}
        />
      )}
    </div>
  )
}
