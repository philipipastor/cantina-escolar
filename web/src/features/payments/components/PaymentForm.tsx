import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Info } from "lucide-react"
import { useNavigate } from "react-router"
import { Alert } from "../../../components/ui/Alert"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { DateSelect } from "../../../components/ui/DateSelect"
import { FieldError } from "../../../components/ui/FieldError"
import { useIdempotencyKey } from "../../../hooks/useIdempotencyKey"
import { ApiError } from "../../../lib/api"
import { formatLongDate, formatNumericDate, todayIso } from "../../../lib/dates"
import { centsToInput, formatCents, parseCents } from "../../../lib/money"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { balanceStatus } from "../../clients/components/BalanceValue"
import { ClientPickerSheet } from "../../clients/components/ClientPickerSheet"
import { ClientSelectCard } from "../../clients/components/ClientSelectCard"
import { formatBalanceText } from "../../clients/components/ReceiptParts"
import type { Balance, Client } from "../../clients/types"
import type { Entry } from "../../sales/types"
import { createPayment } from "../api"
import { paymentSchema, type PaymentFormInput } from "../schemas"
import type { PaymentConfirmation } from "../types"
import { AmountField } from "./AmountField"
import { PaymentMethodPicker } from "./PaymentMethodPicker"

// Explica o que vai acontecer com o valor. Pagar além da dívida é permitido: o excedente vira crédito.
function amountHint(balance: Balance | undefined, amountCents: number) {
  if (!balance) return "O valor será abatido do saldo em aberto."
  const owed = balance.amountOwedCents
  if (owed === 0) return "Sem saldo em aberto: o valor ficará como crédito na conta."
  if (amountCents === 0) return "O valor será abatido do saldo em aberto."
  if (amountCents < owed) {
    return `Deve ${formatCents(owed)} e passará a dever ${formatCents(owed - amountCents)}.`
  }
  if (amountCents === owed) return `Deve ${formatCents(owed)} e vai quitar todo o saldo em aberto.`
  return `${formatCents(owed)} quitam o saldo em aberto e ${formatCents(amountCents - owed)} ficam como crédito.`
}

// Título do saldo previsto, conforme a situação depois do pagamento.
const balanceAfterLabel = {
  DEBT: "Saldo devedor após pagamento",
  CREDIT: "Crédito após pagamento",
  ZERO: "Saldo após pagamento",
}

export type PaymentFormInitial = { client?: Client; redoing?: Entry }

export function PaymentForm({ initial }: { initial: PaymentFormInitial }) {
  const canteen = useCurrentCanteen()
  const navigate = useNavigate()
  const keyFor = useIdempotencyKey()
  const [client, setClient] = useState<Client | null>(initial.client ?? null)
  const [isPicking, setIsPicking] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const today = todayIso()
  const { redoing } = initial
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentSchema),
    // Ao refazer, o formulário já vem com os dados do recebimento estornado, para corrigir só o que errou.
    defaultValues: {
      clientId: initial.client?.id ?? "",
      amount: redoing ? centsToInput(Math.abs(redoing.amountCents)) : "",
      paymentMethod: redoing?.paymentMethod ?? undefined,
      date: redoing?.referenceDate ?? today,
    },
  })
  const amount = useWatch({ control, name: "amount" })
  const date = useWatch({ control, name: "date" })
  const amountCents = parseCents(amount) ?? 0
  // Saldo previsto depois deste pagamento (negativo é dívida); só serve para a tela, quem calcula é a API.
  const balanceAfter = (client?.balance.balanceCents ?? 0) + amountCents

  const onSubmit = handleSubmit(async ({ clientId, amount: typed, paymentMethod, date: referenceDate }) => {
    if (!client) return
    setFormError(null)
    const input = {
      clientId,
      amountCents: parseCents(typed)!,
      paymentMethod,
      referenceDate,
      redoneFromId: redoing?.id,
    }
    try {
      const result = await createPayment(canteen.id, { ...input, idempotencyKey: keyFor(input) })
      const confirmation: PaymentConfirmation = {
        clientName: client.name,
        amountCents: result.entry.amountCents,
        paymentMethod,
        referenceDate: result.entry.referenceDate,
        balanceBeforeCents: result.effect?.balanceBefore.balanceCents ?? client.balance.balanceCents,
        balance: result.balance,
      }
      navigate("/pagamento/confirmado", { replace: true, state: confirmation })
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Não foi possível registrar o recebimento.")
    }
  })

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4.5 px-5">
        {redoing && (
          <Alert variant="note">Refazendo um recebimento estornado. Corrija o que for preciso.</Alert>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="text-section font-semibold">De quem você vai receber?</h2>
          <ClientSelectCard client={client} showChildren onClick={() => setIsPicking(true)} />
          <FieldError message={errors.clientId?.message} />
        </section>

        <Card className="p-4.5">
          <AmountField
            label="Valor a receber"
            hint={amountHint(client?.balance, amountCents)}
            error={errors.amount?.message}
            action={
              client && client.balance.amountOwedCents > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    setValue("amount", centsToInput(client.balance.amountOwedCents), {
                      shouldValidate: isSubmitted,
                    })
                  }
                  className="text-caption font-semibold text-primary hover:underline"
                >
                  Receber tudo
                </button>
              ) : undefined
            }
            {...register("amount")}
          />
        </Card>

        <PaymentMethodPicker
          title="Como você recebeu?"
          error={errors.paymentMethod?.message}
          field={register("paymentMethod")}
        />

        <Card className="flex flex-col gap-3 p-4">
          <DateSelect
            label="Data do recebimento"
            value={date}
            max={today}
            displayText={date === today ? `Hoje, ${formatLongDate(date)}` : formatLongDate(date)}
            className="h-auto gap-2 rounded-none border-0 px-0 text-caption"
            onChange={(value) => setValue("date", value)}
          />
          {client && (
            <>
              <hr className="border-line" />
              <div className="flex items-center justify-between gap-3 text-caption">
                <span className="text-muted">Saldo atual</span>
                <span>{formatBalanceText(client.balance.balanceCents)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-small font-semibold">
                  {balanceAfterLabel[balanceStatus(balanceAfter)]}
                </span>
                {/* O título já diz se é dívida ou crédito; aqui vai só o valor. */}
                <span className="text-lead font-bold">{formatCents(Math.abs(balanceAfter))}</span>
              </div>
            </>
          )}
        </Card>

        {date !== today && (
          <Alert variant="note">
            Este recebimento será lançado em {formatNumericDate(date)}, não na data de hoje.
          </Alert>
        )}
        {formError && <Alert>{formError}</Alert>}

        <Button type="submit" loading={isSubmitting}>
          <Check className="size-4.5" strokeWidth={1.5} aria-hidden />
          Confirmar recebimento
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-nav text-muted">
          <Info className="size-3" strokeWidth={1.5} aria-hidden />
          Registre apenas pagamentos já recebidos.
        </p>
      </form>

      {isPicking && (
        <ClientPickerSheet
          canteenId={canteen.id}
          onClose={() => setIsPicking(false)}
          onSelect={(selected) => {
            setClient(selected)
            setValue("clientId", selected.id, { shouldValidate: isSubmitted })
            setIsPicking(false)
          }}
        />
      )}
    </>
  )
}
