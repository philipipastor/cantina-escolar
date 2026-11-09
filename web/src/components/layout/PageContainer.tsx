import type { ReactNode } from "react"

/**
 * O Figma foi desenhado para celular (402px). Em telas maiores, o conteúdo fica centralizado com
 * largura máxima, como combinado, até existir um layout próprio para computador.
 */
export function PageContainer({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-120 pb-8">{children}</main>
}
