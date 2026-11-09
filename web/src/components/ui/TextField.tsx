import { useId, useState, type InputHTMLAttributes, type Ref } from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "../../lib/cn"

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  ref?: Ref<HTMLInputElement>
}

/**
 * Campo do Figma: rótulo acima, entrada de 50px com borda #E8EAEE e cantos de 12px.
 * Com type="password", ganha o botão de mostrar ou esconder a senha.
 */
export function TextField({ label, error, type = "text", className, id, ref, ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === "password"

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={inputId} className="text-small font-semibold text-ink">
        {label}
      </label>
      <div
        className={cn(
          "flex h-12.5 items-center rounded-field border border-line bg-surface px-3.5 transition",
          "focus-within:border-primary",
          error && "border-primary",
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type={isPassword && showPassword ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-small text-ink outline-none placeholder:text-muted"
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
      {error && (
        <p id={errorId} className="text-caption text-primary">
          {error}
        </p>
      )}
    </div>
  )
}
