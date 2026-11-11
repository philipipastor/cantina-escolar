import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react"
import { cn } from "../../../lib/cn"
import { withMoneyMask } from "../../../lib/moneyInput"

type AmountFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  // Ação ao lado do rótulo, como "Receber tudo".
  action?: ReactNode
  hint?: string
  error?: string
  ref?: Ref<HTMLInputElement>
}

// Campo de valor em destaque, já com a máscara de dinheiro: o valor se forma da direita para a esquerda.
// Fica cinza enquanto vazio e ganha a borda vermelha ao ser preenchido.
export function AmountField({ label, action, hint, error, className, ...props }: AmountFieldProps) {
  const id = useId()
  const describedBy = `${id}-description`

  return (
    <div className={cn("flex flex-col gap-3.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-small font-semibold">
          {label}
        </label>
        {action}
      </div>
      <div
        className={cn(
          "flex h-15 items-center gap-2.5 rounded-field border-[1.5px] border-transparent bg-page px-4 transition",
          "focus-within:border-primary has-[input:not(:placeholder-shown)]:border-primary",
          error && "border-primary",
        )}
      >
        <span className="text-currency text-muted">R$</span>
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? describedBy : undefined}
          className="h-full w-full min-w-0 bg-transparent text-entry font-semibold caret-primary outline-none placeholder:text-muted"
          {...withMoneyMask(props)}
        />
      </div>
      {(error || hint) && (
        <p id={describedBy} className={cn(error ? "text-caption text-primary" : "text-mini text-muted")}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
