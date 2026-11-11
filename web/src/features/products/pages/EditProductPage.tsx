import { useCallback } from "react"
import { useNavigate, useParams } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { ErrorState, LoadingState } from "../../../components/ui/States"
import { useApiData } from "../../../hooks/useApiData"
import { centsToInput } from "../../../lib/money"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { fetchProduct, updateProduct } from "../api"
import { ProductForm } from "../components/ProductForm"

export function EditProductPage() {
  const canteen = useCurrentCanteen()
  const navigate = useNavigate()
  const { id = "" } = useParams()
  const load = useCallback(() => fetchProduct(canteen.id, id), [canteen.id, id])
  const { data: product, error, reload } = useApiData(load)

  if (error && !product) return <ErrorState message={error.message} onRetry={reload} />
  if (!product) return <LoadingState label="Carregando produto" />

  return (
    <PageContainer>
      <PageHeader
        title="Editar produto"
        subtitle="Atualize os dados e a disponibilidade do produto."
        back={{ to: "/produtos", label: "Voltar" }}
      />
      <ProductForm
        isEditing
        defaultValues={{
          name: product.name,
          price: centsToInput(product.priceCents),
          isActive: product.isActive,
        }}
        submitLabel="Salvar alterações"
        onSubmit={async (input) => {
          await updateProduct(canteen.id, id, input)
          navigate("/produtos", { replace: true })
        }}
      />
    </PageContainer>
  )
}
