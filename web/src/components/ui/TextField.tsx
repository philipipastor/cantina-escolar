import { useId, useState, type InputHTMLAttributes, type Ref } from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "../../lib/cn"

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  // Texto de ajuda abaixo do campo, trocado pelo erro quando houver.
  hint?: string
  // Mostra "Opcional" ao lado do rótulo.
  optional?: boolean
  // Texto fixo antes do valor, como "R$".
  prefix?: string
  ref?: Ref<HTMLInputElement>
}

/**
 * Campo do Figma: rótulo acima, entrada de 50px com borda #E8EAEE e cantos de 12px.
 * Com type="password", ganha o botão de mostrar ou esconder a senha.
 */
export function TextField({
  label,
  error,
  hint,
  optional,
  prefix,
  type = "text",
  className,
  id,
  ref,
  ...props
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === "password"
  const message = error ?? hint

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-small font-semibold text-ink">
          {label}
        </label>
        {optional && <span className="text-nav text-muted">Opcional</span>}
      </div>
      <div
        className={cn(
          "flex h-12.5 items-center gap-2 rounded-field border border-line bg-surface px-3.5 transition",
          "focus-within:border-primary",
          // Campo desativado (como o login na edição) ganha fundo cinza para não parecer editável.
          "has-[input:disabled]:bg-page has-[input:disabled]:text-muted",
          error && "border-primary",
        )}
      >
        {prefix && <span className="text-small text-muted">{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          type={isPassword && showPassword ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-small text-ink outline-none placeholder:text-muted disabled:text-muted"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
            className="-mr-1 flex size-8 items-center justify-center rounded-full text-muted hover:text-ink"
          >
            {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
          </button>
        )}
      </div>
      {message && (
        <p id={messageId} className={cn("text-nav", error ? "text-caption text-primary" : "text-muted")}>
          {message}
        </p>
      )}
    </div>
  )
}
