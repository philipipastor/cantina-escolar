import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserRoundPlus } from "lucide-react"
import { useNavigate } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { Alert } from "../../../components/ui/Alert"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { SelectField } from "../../../components/ui/SelectField"
import { TextField } from "../../../components/ui/TextField"
import { ApiError } from "../../../lib/api"
import { firstName } from "../../../lib/text"
import { useCanteen } from "../../canteens/CanteenContext"
import { createUser } from "../api"
import { FormNote } from "../components/FormNote"
import { newUserSchema, type NewUserFormInput } from "../schemas"

const roleOptions = [
  { value: "EMPLOYEE", label: "Funcionário" },
  { value: "ADMIN", label: "Administrador" },
]

export function NewUserPage() {
  const navigate = useNavigate()
  const { canteens } = useCanteen()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<NewUserFormInput>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { name: "", username: "", role: "EMPLOYEE", canteenId: "", password: "" },
  })
  const role = useWatch({ control, name: "role" })
  // Só cantinas ativas recebem novos funcionários.
  const canteenOptions = canteens
    .filter((canteen) => canteen.isActive)
    .map((canteen) => ({ value: canteen.id, label: canteen.name }))

  const onSubmit = handleSubmit(async ({ canteenId, ...input }) => {
    setFormError(null)
    try {
      const user = await createUser({ ...input, canteenId: input.role === "ADMIN" ? null : canteenId })
      navigate("/usuarios", {
        replace: true,
        state: {
          success: `Usuário de ${firstName(user.name)} criado. Entregue o login "${user.username}" e a senha inicial.`,
        },
      })
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Não foi possível criar o usuário.")
    }
  })

  return (
    <PageContainer>
      <PageHeader
        title="Novo usuário"
        subtitle="Controle quem pode acessar o sistema."
        back={{ to: "/usuarios", label: "Gerenciar usuários" }}
      />
      <form onSubmit={onSubmit} noValidate className="px-5 pb-6">
        <Card className="flex flex-col gap-5 p-4.5">
          <h2 className="text-section font-semibold">Novo usuário</h2>
          <TextField
            label="Nome completo"
            placeholder="Ex.: Ana Souza"
            autoComplete="off"
            error={errors.name?.message}
            {...register("name")}
          />
          <TextField
            label="Usuário"
            placeholder="Ex.: ana"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            hint="É o login. Não pode ser alterado depois."
            error={errors.username?.message}
            {...register("username")}
          />
          <SelectField label="Papel" options={roleOptions} {...register("role")} />
          {role === "EMPLOYEE" && (
            <SelectField
              label="Cantina"
              placeholder="Selecionar unidade"
              options={canteenOptions}
              error={errors.canteenId?.message}
              {...register("canteenId")}
            />
          )}
          <TextField
            label="Senha inicial"
            type="password"
            placeholder="Mínimo de 8 caracteres"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          {formError && <Alert>{formError}</Alert>}
          <Button type="submit" loading={isSubmitting}>
            <UserRoundPlus className="size-4.5" strokeWidth={1.5} aria-hidden />
            Criar usuário
          </Button>
          <FormNote>
            {role === "EMPLOYEE"
              ? "Funcionários acessam apenas sua cantina."
              : "Administradores acessam todas as cantinas."}
          </FormNote>
        </Card>
      </form>
    </PageContainer>
  )
}
