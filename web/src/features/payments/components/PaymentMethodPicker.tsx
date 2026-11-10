import { Banknote, CreditCard, QrCode } from "lucide-react"
import type { UseFormRegisterReturn } from "react-hook-form"
import { FieldError } from "../../../components/ui/FieldError"
import { paymentMethodLabels } from "../../clients/paymentMethod"
import type { PaymentMethod } from "../../clients/types"

const methods: { value: PaymentMethod; Icon: typeof QrCode }[] = [
  { value: "PIX", Icon: QrCode },
  { value: "CASH", Icon: Banknote },
  { value: "CARD", Icon: CreditCard },
]

type PaymentMethodPickerProps = {
  title: string
  error?: string
  field: UseFormRegisterReturn
}

/**
 * São botões de rádio de verdade, só com outra aparência: o teclado e o leitor de tela já sabem que
 * é uma escolha única, e o CSS muda o visual sozinho quando a opção está marcada.
 * Nenhuma vem marcada: um Pix pré-selecionado seria registrado por engano em um pagamento em dinheiro.
 */
export function PaymentMethodPicker({ title, error, field }: PaymentMethodPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2.5 text-section font-semibold">{title}</legend>
      <div className="grid grid-cols-3 gap-2.5">
        {methods.map(({ value, Icon }) => (
          <label
            key={value}
            className="flex h-19 cursor-pointer flex-col items-center justify-center gap-2 rounded-field border border-line bg-surface text-caption font-semibold transition hover:bg-page has-checked:border-[1.5px] has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
          >
            <input type="radio" value={value} className="sr-only" {...field} />
            <Icon className="size-5.5" strokeWidth={1.5} aria-hidden />
            {paymentMethodLabels[value]}
          </label>
        ))}
      </div>
      <FieldError message={error} />
    </fieldset>
  )
}
