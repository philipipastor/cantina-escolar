import { Check } from "lucide-react"

// Topo das telas de confirmação: selo vermelho, título e mensagem.
export function SuccessHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 pt-7 pb-5 text-center">
      <span
        aria-hidden
        className="mb-2 flex size-17 items-center justify-center rounded-full bg-primary-soft"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-primary text-white">
          <Check className="size-5.5" strokeWidth={1.5} />
        </span>
      </span>
      <h1 className="text-title font-bold">{title}</h1>
      <p className="text-small text-muted">{subtitle}</p>
    </div>
  )
}
