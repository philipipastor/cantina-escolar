import type { InputHTMLAttributes, Ref } from "react"

type SwitchProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  description?: string
  ref?: Ref<HTMLInputElement>
}

// Interruptor do Figma. Por baixo é um checkbox de verdade, o que mantém o teclado e os leitores de tela.
export function Switch({ label, description, ref, ...props }: SwitchProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input ref={ref} type="checkbox" role="switch" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className="relative h-6.5 w-11 shrink-0 rounded-full bg-line transition peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary after:absolute after:top-0.75 after:left-0.75 after:size-5 after:rounded-full after:bg-surface after:transition peer-checked:after:translate-x-4.5"
      />
      <span className="min-w-0">
        <span className="block text-small font-semibold">{label}</span>
        {description && <span className="block text-nav text-muted">{description}</span>}
      </span>
    </label>
  )
}
