import { ArrowLeft } from "lucide-react"
import { Link } from "react-router"

type PageHeaderProps = {
  title: string
  subtitle?: string
  // Link "← Voltar" acima do título.
  back?: { to: string; label: string }
}

// Título e subtítulo de cada tela, com o espaçamento do Figma (20px nas laterais, 4px entre os textos).
export function PageHeader({ title, subtitle, back }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 px-5 py-5">
      {back && (
        <Link
          to={back.to}
          className="mb-2 flex w-fit items-center gap-1 text-caption font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {back.label}
        </Link>
      )}
      <h1 className="text-title font-bold">{title}</h1>
      {subtitle && <p className="text-small text-muted">{subtitle}</p>}
    </div>
  )
}
