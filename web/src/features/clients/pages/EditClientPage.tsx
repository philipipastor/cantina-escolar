import { useCallback, useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { Alert } from "../../../components/ui/Alert"
import { Button } from "../../../components/ui/Button"
import { ErrorState, LoadingState } from "../../../components/ui/States"
import { TextField } from "../../../components/ui/TextField"
import { useApiData } from "../../../hooks/useApiData"
import { ApiError } from "../../../lib/api"
import { formatPhone } from "../../../lib/text"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { createChild, fetchClient, updateChild, updateClient } from "../api"
import { AddChildField } from "../components/AddChildField"
import { FormSection } from "../../../components/ui/FormSection"
import { clientSchema, type ClientFormInput } from "../schemas"

const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : "Não foi possível salvar. Tente novamente."

export function EditClientPage() {
  const canteen = useCurrentCanteen()
  const { id = "" } = useParams()
  const load = useCallback(() => fetchClient(canteen.id, id), [canteen.id, id])
  const { data: client, error, isLoading, reload } = useApiData(load)

  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormInput>({ resolver: zodResolver(clientSchema) })
  const phoneField = register("phone")

  // Preenche o formulário só na primeira carga: recarregar depois de mexer em um filho não pode
  // apagar o que a pessoa já tinha digitado nos outros campos.
  const isFilled = useRef(false)
  useEffect(() => {
    if (!client || isFilled.current) return
    isFilled.current = true
    reset({ name: client.name, notes: client.notes ?? "", phone: client.phone ?? "" })
  }, [client, reset])

  const onSubmit = handleSubmit(async ({ name, notes, phone }) => {
    setFeedback(null)
    try {
      await updateClient(canteen.id, id, { name, notes: notes || null, phone: phone || null })
      setFeedback({ variant: "success", message: "Dados salvos." })
    } catch (failure) {
      setFeedback({ variant: "error", message: errorMessage(failure) })
    }
  })

  // Filhos e status são salvos na hora, sem depender do botão do formulário.
  async function run(action: () => Promise<unknown>, success: string) {
    setFeedback(null)
    setIsBusy(true)
    try {
      await action()
      setFeedback({ variant: "success", message: success })
      reload()
    } catch (failure) {
      setFeedback({ variant: "error", message: errorMessage(failure) })
    } finally {
      setIsBusy(false)
    }
  }

  if (error && !client) return <ErrorState message={error.message} onRetry={reload} />
  if (isLoading && !client) return <LoadingState label="Carregando cliente" />
  if (!client) return null

  return (
    <PageContainer>
      <PageHeader
        title="Editar cliente"
        subtitle="Atualize os dados e os filhos vinculados."
        back={{ to: `/clientes/${id}`, label: "Relatório do cliente" }}
      />
      <div className="flex flex-col gap-3.5 px-5">
        <form onSubmit={onSubmit} noValidate>
          <FormSection title="Dados do cliente" description="Inativar não apaga o histórico da conta.">
            <TextField label="Nome completo" error={errors.name?.message} {...register("name")} />
            <TextField label="Observação" optional error={errors.notes?.message} {...register("notes")} />
            <TextField
              label="Número de telefone com DDD"
              inputMode="tel"
              autoComplete="off"
              error={errors.phone?.message}
              {...phoneField}
              onChange={(event) => {
                event.target.value = formatPhone(event.target.value)
                return phoneField.onChange(event)
              }}
            />
            <Button type="submit" loading={isSubmitting}>
              Salvar alterações
            </Button>
          </FormSection>
        </form>

        <FormSection
          title="Filhos vinculados"
          description="Inativar um filho mantém as compras já registradas."
        >
          <AddChildField
            disabled={isBusy}
            onAdd={(name) => run(() => createChild(canteen.id, id, name), "Filho adicionado.")}
          />
          {client.children.length > 0 && (
            <ul className="divide-y divide-line">
              {client.children.map((child) => (
                <li key={child.id} className="flex items-center justify-between py-2.5">
                  <span className={child.isActive ? "text-small" : "text-small text-muted line-through"}>
                    {child.name}
                  </span>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      run(
                        () => updateChild(canteen.id, id, child.id, { isActive: !child.isActive }),
                        child.isActive ? "Filho inativado." : "Filho reativado.",
                      )
                    }
                    className="text-caption font-medium text-primary hover:underline disabled:opacity-60"
                  >
                    {child.isActive ? "Inativar" : "Reativar"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </FormSection>

        {feedback && <Alert variant={feedback.variant}>{feedback.message}</Alert>}

        <Button
          variant="outline"
          disabled={isBusy}
          onClick={() =>
            run(
              () => updateClient(canteen.id, id, { isActive: !client.isActive }),
              client.isActive ? "Cliente inativado." : "Cliente reativado.",
            )
          }
        >
          {client.isActive ? "Inativar cliente" : "Reativar cliente"}
        </Button>
      </div>
    </PageContainer>
  )
}
