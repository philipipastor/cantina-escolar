import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { Alert } from "../../../components/ui/Alert"
import { Button } from "../../../components/ui/Button"
import { FormSection } from "../../../components/ui/FormSection"
import { TextField } from "../../../components/ui/TextField"
import { ApiError } from "../../../lib/api"
import { createCanteen } from "../api"
import { canteenSchema, type CanteenFormInput } from "../schemas"

export function NewCanteenForm({ onCreated }: { onCreated: () => void }) {
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CanteenFormInput>({
    resolver: zodResolver(canteenSchema),
    defaultValues: { name: "" },
  })

  const onSubmit = handleSubmit(async ({ name }) => {
    setFeedback(null)
    try {
      const canteen = await createCanteen(name)
      reset()
      setFeedback({ variant: "success", message: `${canteen.name} cadastrada.` })
      onCreated()
    } catch (error) {
      setFeedback({
        variant: "error",
        message: error instanceof ApiError ? error.message : "Não foi possível criar a empresa.",
      })
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormSection title="Nova empresa" description="Cadastre uma nova empresa no sistema.">
        <TextField
          label="Nome da empresa *"
          placeholder="Ex: Cantina Central"
          error={errors.name?.message}
          {...register("name")}
        />
        {feedback && <Alert variant={feedback.variant}>{feedback.message}</Alert>}
        <Button type="submit" loading={isSubmitting}>
          <Plus className="size-4.5" strokeWidth={1.5} aria-hidden />
          Criar empresa
        </Button>
      </FormSection>
    </form>
  )
}
