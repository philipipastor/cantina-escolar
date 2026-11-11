import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check } from "lucide-react"
import { Alert } from "../../../components/ui/Alert"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { Switch } from "../../../components/ui/Switch"
import { TextField } from "../../../components/ui/TextField"
import { ApiError } from "../../../lib/api"
import { parseCents } from "../../../lib/money"
import { withMoneyMask } from "../../../lib/moneyInput"
import { productSchema, type ProductFormInput } from "../schemas"

type ProductFormProps = {
  defaultValues: ProductFormInput
  submitLabel: string
  // O interruptor e o aviso de preço só existem na edição.
  isEditing?: boolean
  onSubmit: (input: { name: string; priceCents: number; isActive: boolean }) => Promise<void>
}

export function ProductForm({ defaultValues, submitLabel, isEditing, onSubmit }: ProductFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput>({ resolver: zodResolver(productSchema), defaultValues })

  const submit = handleSubmit(async ({ name, price, isActive }) => {
    setFormError(null)
    try {
      await onSubmit({ name, priceCents: parseCents(price)!, isActive })
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Não foi possível salvar o produto.")
    }
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 px-5">
      <Card className="flex flex-col gap-5 p-4.5">
        <TextField
          label="Nome do produto"
          placeholder="Ex.: Salgado"
          error={errors.name?.message}
          {...register("name")}
        />
        <TextField
          label="Preço de venda"
          prefix="R$"
          error={errors.price?.message}
          {...withMoneyMask(register("price"))}
        />
        {isEditing && (
          <>
            <Switch
              label="Produto ativo"
              description="Produto visível para registro de compras."
              {...register("isActive")}
            />
            <Alert variant="note">Alterar o preço não modifica compras anteriores.</Alert>
          </>
        )}
      </Card>
      {formError && <Alert>{formError}</Alert>}
      <Button type="submit" loading={isSubmitting}>
        <Check className="size-4.5" strokeWidth={1.5} aria-hidden />
        {submitLabel}
      </Button>
    </form>
  )
}
