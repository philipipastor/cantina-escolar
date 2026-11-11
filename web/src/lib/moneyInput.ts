import type { ChangeEvent } from "react"
import { maskMoneyInput } from "./money"

type FieldProps = { onChange?: (event: ChangeEvent<HTMLInputElement>) => unknown }

// Transforma qualquer campo de texto em campo de dinheiro. Funciona com o register do React Hook Form:
//   <TextField prefix="R$" {...withMoneyMask(register("price"))} />
// A cada tecla, troca o texto pela versão mascarada ("1.234,50") antes de o formulário ler o valor.
// O formulário continua guardando texto, e parseCents o converte em centavos inteiros no envio.
export function withMoneyMask<T extends FieldProps>(field: T) {
  return {
    placeholder: "0,00",
    autoComplete: "off",
    // Teclado só de números no iPhone e no Android: não é preciso digitar vírgula nem ponto.
    inputMode: "numeric" as const,
    ...field,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      event.target.value = maskMoneyInput(event.target.value)
      return field.onChange?.(event)
    },
  }
}
