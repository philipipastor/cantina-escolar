import type { ReactNode } from "react"
import { Card } from "./Card"

// Bloco de formulário do Figma: cartão com título, descrição curta e os campos.
export function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Card className="flex flex-col gap-4 p-4.5">
      <div>
        <h2 className="text-small font-semibold">{title}</h2>
        <p className="text-nav text-muted">{description}</p>
      </div>
      {children}
    </Card>
  )
}
