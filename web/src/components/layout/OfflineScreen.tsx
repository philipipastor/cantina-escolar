import { WifiOff } from "lucide-react"
import { AppHeader } from "./AppHeader"
import { PageContainer } from "./PageContainer"

/**
 * O sistema só funciona com internet, como combinado: registrar fiado sem conexão poderia duplicar
 * lançamentos. Sem conexão, esta tela substitui as demais e some sozinha quando a internet volta.
 */
export function OfflineScreen() {
  return (
    <>
      <AppHeader />
      <PageContainer>
        <div className="flex flex-col items-center gap-3 px-5 pt-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <WifiOff className="size-7" aria-hidden />
          </div>
          <h1 className="text-section font-semibold">Sem conexão com a internet</h1>
          <p className="max-w-70 text-small text-muted">
            O sistema precisa de internet para funcionar. Assim que a conexão voltar, esta tela some sozinha.
          </p>
        </div>
      </PageContainer>
    </>
  )
}
