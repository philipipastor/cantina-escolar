import type { ReactNode } from "react"
import brandMark from "../../assets/brand-mark.svg"

type AppHeaderProps = {
  title?: string
  // Conteúdo do lado direito, como o avatar com o menu "Sair / Redefinir senha".
  action?: ReactNode
}

// Faixa branca do topo: símbolo da marca (exportado do Figma), nome e, à direita, uma ação opcional.
export function AppHeader({ title = "Cantina", action }: AppHeaderProps) {
  return (
    <header className="bg-surface">
      <div className="mx-auto flex h-13.5 max-w-120 items-center justify-between px-5">
        <div className="flex items-center gap-2.25">
          <img src={brandMark} alt="" width={30} height={32} />
          <span className="text-[17px] leading-[1.4] font-bold">{title}</span>
        </div>
        {action}
      </div>
    </header>
  )
}
