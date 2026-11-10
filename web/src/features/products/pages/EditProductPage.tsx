import { useCallback } from "react"
import { useNavigate, useParams } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { ErrorState, LoadingState } from "../../../components/ui/States"
import { useApiData } from "../../../hooks/useApiData"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { fetchProduct, updateProduct } from "../api"
import { ProductForm } from "../components/ProductForm"

// Centavos para o texto do campo: 650 vira "6,50".
const toPriceText = (cents: number) => (cents / 100).toFixed(2).replace(".", ",")

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
          price: toPriceText(product.priceCents),
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
