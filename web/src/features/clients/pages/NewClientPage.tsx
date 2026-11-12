import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserRoundPlus, X } from "lucide-react"
import { useLocation, useNavigate } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { Alert } from "../../../components/ui/Alert"
import { Avatar } from "../../../components/ui/Avatar"
import { Button } from "../../../components/ui/Button"
import { FilterChips } from "../../../components/ui/FilterChips"
import { TextField } from "../../../components/ui/TextField"
import { ApiError } from "../../../lib/api"
import { parseCents } from "../../../lib/money"
import { withMoneyMask } from "../../../lib/moneyInput"
import { formatPhone } from "../../../lib/text"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import { createClient, createOpeningBalance } from "../api"
import { AddChildField } from "../components/AddChildField"
import { FormSection } from "../../../components/ui/FormSection"
import { newClientSchema, type NewClientFormInput } from "../schemas"

const openingOptions: { value: NewClientFormInput["openingNature"]; label: string }[] = [
  { value: "NONE", label: "Não tem" },
  { value: "DEBT", label: "Deve" },
  { value: "CREDIT", label: "Tem crédito" },
]

export function NewClientPage() {
  const canteen = useCurrentCanteen()
  const navigate = useNavigate()
  // Veio do botão "Novo cliente" da venda: ao terminar, volta para a venda com ele selecionado.
  const returnToSale = (useLocation().state as { returnToSale?: boolean } | null)?.returnToSale
  const [children, setChildren] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  // Gerada uma vez por formulário: se o envio repetir, a API não lança o saldo anterior duas vezes.
  const [openingKey] = useState(() => crypto.randomUUID())
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<NewClientFormInput>({
    resolver: zodResolver(newClientSchema),
    defaultValues: { name: "", notes: "", phone: "", openingNature: "NONE", openingAmount: "" },
  })
  const openingNature = useWatch({ control, name: "openingNature" })
  const phoneField = register("phone")

  const onSubmit = handleSubmit(async ({ name, notes, phone, openingNature: nature, openingAmount }) => {
    setFormError(null)
    let clientId: string
    try {
      const client = await createClient(canteen.id, {
        name,
        notes: notes || null,
        phone: phone || null,
        children: children.map((child) => ({ name: child })),
      })
      clientId = client.id
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Não foi possível cadastrar o cliente.")
      return
    }

    // O cliente já existe a partir daqui: uma falha no saldo não pode fazer a pessoa cadastrá-lo de novo.
    let warning: string | undefined
    if (nature !== "NONE") {
      try {
        await createOpeningBalance(canteen.id, {
          clientId,
          nature,
          amountCents: parseCents(openingAmount)!,
          idempotencyKey: openingKey,
        })
      } catch {
        warning = "Cliente cadastrado, mas o saldo anterior não foi lançado. Confira e tente de novo."
      }
    }
    if (returnToSale && !warning) {
      navigate(`/venda?cliente=${clientId}`, { replace: true })
      return
    }
    navigate(`/clientes/${clientId}`, { replace: true, state: { warning } })
  })

  return (
    <PageContainer>
      <PageHeader title="Cadastrar cliente" subtitle="Mais um cliente por perto. Tudo organizado." />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5 px-5">
        <FormSection title="Dados do cliente" description="Preencha os dados para abrir a caderneta.">
          <TextField
            label="Nome completo"
            placeholder="Ex.: Maria Silva"
            hint="Informe o nome e o sobrenome do cliente."
            error={errors.name?.message}
            {...register("name")}
          />
          <TextField
            label="Observação"
            optional
            placeholder="Ex.: informações adicionais"
            error={errors.notes?.message}
            {...register("notes")}
          />
          <TextField
            label="Número de telefone com DDD"
            placeholder="(11) 99999-9999"
            inputMode="tel"
            autoComplete="off"
            hint="Inclua o DDD para enviar comprovantes ao cliente."
            error={errors.phone?.message}
            {...phoneField}
            onChange={(event) => {
              event.target.value = formatPhone(event.target.value)
              return phoneField.onChange(event)
            }}
          />
        </FormSection>

        <FormSection
          title="Filhos vinculados"
          description="Adicione os filhos que fazem compras junto com esse cliente."
        >
          <AddChildField onAdd={(name) => setChildren((current) => [...current, name])} />
          {children.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Filhos adicionados">
              {children.map((child, index) => (
                <li
                  key={`${child}-${index}`}
                  className="flex items-center gap-1.5 rounded-full bg-primary-soft py-1 pr-1 pl-1 text-caption font-medium text-primary"
                >
                  <Avatar name={child} variant="accent" className="size-5 bg-surface text-nav" />
                  {child}
                  <button
                    type="button"
                    aria-label={`Remover ${child}`}
                    onClick={() => setChildren((current) => current.filter((_, item) => item !== index))}
                    className="flex size-5 items-center justify-center rounded-full hover:bg-primary-tint"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </FormSection>

        <FormSection
          title="Saldo anterior"
          description="Só se o cliente já devia ou tinha crédito antes de usar o sistema."
        >
          <FilterChips
            label="Saldo anterior"
            options={openingOptions}
            value={openingNature}
            onChange={(value) => setValue("openingNature", value, { shouldValidate: false })}
          />
          {openingNature !== "NONE" && (
            <TextField
              label={openingNature === "DEBT" ? "Valor que o cliente devia" : "Crédito que o cliente tinha"}
              prefix="R$"
              error={errors.openingAmount?.message}
              {...withMoneyMask(register("openingAmount"))}
            />
          )}
        </FormSection>

        <Alert variant="note">Confira o telefone com o cliente antes de cadastrar.</Alert>
        {formError && <Alert>{formError}</Alert>}
        <Button type="submit" loading={isSubmitting}>
          <UserRoundPlus className="size-4.5" strokeWidth={1.5} aria-hidden />
          Cadastrar cliente
        </Button>
        <p className="text-center text-nav text-muted">Depois, você já pode registrar vendas para ele.</p>
      </form>
    </PageContainer>
  )
}
