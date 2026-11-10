import { useId, type Ref, type SelectHTMLAttributes } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/cn"

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: { value: string; label: string }[]
  // Primeira opção vazia, como "Selecionar unidade".
  placeholder?: string
  error?: string
  ref?: Ref<HTMLSelectElement>
}

/**
 * Lista de escolha no visual do TextField (rótulo acima, caixa de 50px com seta). Por baixo é o
 * <select> nativo: no celular, abre a lista do próprio sistema, que é familiar e acessível.
 */
export function SelectField({
  label,
  options,
  placeholder,
  error,
  className,
  id,
  ref,
  ...props
}: SelectFieldProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const messageId = `${selectId}-message`

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={selectId} className="text-small font-semibold text-ink">
        {label}
      </label>
      <div
        className={cn(
          "relative flex h-12.5 items-center rounded-field border border-line bg-surface transition",
          "focus-within:border-primary",
          error && "border-primary",
        )}
      >
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? messageId : undefined}
          className="h-full w-full appearance-none bg-transparent pr-9 pl-3.5 text-small text-ink outline-none has-[option[value='']:checked]:text-muted"
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="text-ink">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 size-4 text-muted"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
      {error && (
        <p id={messageId} className="text-caption text-primary">
          {error}
        </p>
      )}
    </div>
  )
}
