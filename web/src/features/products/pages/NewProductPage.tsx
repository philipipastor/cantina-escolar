import { useNavigate } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { createProduct } from "../api"
import { ProductForm } from "../components/ProductForm"

export function NewProductPage() {
  const canteen = useCurrentCanteen()
  const navigate = useNavigate()

  return (
    <PageContainer>
      <PageHeader
        title="Cadastrar produto"
        subtitle="Informe o nome e o preço de venda."
        back={{ to: "/produtos", label: "Voltar" }}
      />
      <ProductForm
        defaultValues={{ name: "", price: "", isActive: true }}
        submitLabel="Cadastrar produto"
        onSubmit={async ({ name, priceCents }) => {
          await createProduct(canteen.id, { name, priceCents })
          navigate("/produtos", { replace: true })
        }}
      />
    </PageContainer>
  )
}
