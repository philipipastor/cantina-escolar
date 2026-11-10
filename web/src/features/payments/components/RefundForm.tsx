import { useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { Alert } from "../../../components/ui/Alert"
import { Avatar } from "../../../components/ui/Avatar"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { DateSelect } from "../../../components/ui/DateSelect"
import { useIdempotencyKey } from "../../../hooks/useIdempotencyKey"
import { ApiError } from "../../../lib/api"
import { formatNumericDate, todayIso } from "../../../lib/dates"
import { centsToInput, formatCents, parseCents } from "../../../lib/money"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { BalanceSummary } from "../../clients/components/BalanceValue"
import type { Client } from "../../clients/types"
import type { Entry } from "../../sales/types"
import { createCreditRefund } from "../api"
import { refundSchema, type RefundFormInput } from "../schemas"
import { AmountField } from "./AmountField"
import { PaymentMethodPicker } from "./PaymentMethodPicker"

type RefundFormProps = {
  client: Client
  // Devolução estornada que esta corrige: o formulário vem preenchido com os dados dela.
  redoing?: Entry
  onCreditChanged: () => void
}

export function RefundForm({ client, redoing, onCreditChanged }: RefundFormProps) {
  const canteen = useCurrentCanteen()
  const navigate = useNavigate()
  const keyFor = useIdempotencyKey()
  const [formError, setFormError] = useState<string | null>(null)
  const today = todayIso()
  const available = client.balance.availableCreditCents
  const schema = useMemo(() => refundSchema(available), [available])
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RefundFormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: redoing ? centsToInput(Math.abs(redoing.amountCents)) : "",
      paymentMethod: redoing?.paymentMethod ?? undefined,
      date: redoing?.referenceDate ?? today,
    },
  })
  const date = useWatch({ control, name: "date" })
  const reportUrl = `/clientes/${client.id}`

  const onSubmit = handleSubmit(async ({ amount, paymentMethod, date: referenceDate }) => {
    setFormError(null)
    const amountCents = parseCents(amount)!
    const input = {
      clientId: client.id,
      amountCents,
      paymentMethod,
      referenceDate,
      redoneFromId: redoing?.id,
    }
    try {
      await createCreditRefund(canteen.id, { ...input, idempotencyKey: keyFor(input) })
      navigate(reportUrl, {
        replace: true,
        state: { success: `Devolução de ${formatCents(amountCents)} registrada.` },
      })
    } catch (error) {
      const failure = error instanceof ApiError ? error : null
      setFormError(failure?.message ?? "Não foi possível registrar a devolução.")
      // O crédito mudou desde que a tela abriu: atualiza o valor disponível para conferir.
      if (failure?.code === "INSUFFICIENT_CREDIT") onCreditChanged()
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 px-5">
      {redoing && <Alert variant="note">Refazendo uma devolução estornada. Corrija o que for preciso.</Alert>}
      <Card className="flex items-center gap-3 p-3.5">
        <Avatar name={client.name} variant="accent" className="size-10" />
        <div className="min-w-0">
          <p className="truncate text-small font-semibold">{client.name}</p>
          <BalanceSummary balance={client.balance} />
        </div>
      </Card>

      <Card className="p-3.5">
        <AmountField label="Valor da devolução" error={errors.amount?.message} {...register("amount")} />
      </Card>

      <PaymentMethodPicker
        title="Forma de pagamento"
        error={errors.paymentMethod?.message}
        field={register("paymentMethod")}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-small font-semibold">Data da devolução</h2>
        <DateSelect
          label="Data da devolução"
          value={date}
          max={today}
          onChange={(value) => setValue("date", value)}
        />
      </section>

      {date !== today && (
        <Alert variant="note">
          Esta devolução será lançada em {formatNumericDate(date)}, não na data de hoje.
        </Alert>
      )}
      {formError && <Alert>{formError}</Alert>}

      <Button type="submit" loading={isSubmitting}>
        <Check className="size-4.5" strokeWidth={1.5} aria-hidden />
        Confirmar devolução
      </Button>
      <Link to={reportUrl} className="py-2 text-center text-caption font-medium text-muted hover:text-ink">
        Cancelar
      </Link>
    </form>
  )
}
