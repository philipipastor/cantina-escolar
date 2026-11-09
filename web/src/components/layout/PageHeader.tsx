// Título e subtítulo de cada tela, com o espaçamento do Figma (20px nas laterais, 4px entre os textos).
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-5">
      <h1 className="text-title font-bold">{title}</h1>
      {subtitle && <p className="text-small text-muted">{subtitle}</p>}
    </div>
  )
}
