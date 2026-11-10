import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { Alert } from "../../../components/ui/Alert"
import { Card } from "../../../components/ui/Card"
import { EmptyState } from "../../../components/ui/States"
import { useCanteen } from "../CanteenContext"
import { CanteenCard } from "../components/CanteenCard"
import { NewCanteenForm } from "../components/NewCanteenForm"

export function CanteensPage() {
  // A lista vem do contexto: assim, uma cantina criada aqui já fica disponível no resto do app.
  const { canteens, reloadCanteens, reloadFailed } = useCanteen()

  return (
    <PageContainer>
      <PageHeader
        title="Gerenciar empresas"
        subtitle="Controle as empresas cadastradas no sistema."
        back={{ to: "/", label: "Início" }}
      />
      <div className="flex flex-col gap-4.5 px-5">
        <section aria-labelledby="canteens-title" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 id="canteens-title" className="text-small font-semibold">
              Suas cantinas
            </h2>
            <span className="text-mini text-muted">
              {canteens.length} {canteens.length === 1 ? "empresa" : "empresas"}
            </span>
          </div>

          {reloadFailed && <Alert>Não foi possível atualizar a lista. Recarregue a página.</Alert>}

          {canteens.length === 0 ? (
            <Card>
              <EmptyState
                title="Nenhuma empresa cadastrada"
                description="Cadastre a primeira empresa abaixo."
              />
            </Card>
          ) : (
            canteens.map((canteen) => (
              <CanteenCard key={canteen.id} canteen={canteen} onChanged={reloadCanteens} />
            ))
          )}
        </section>

        <NewCanteenForm onCreated={reloadCanteens} />
      </div>
    </PageContainer>
  )
}
