import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check } from "lucide-react"
import { useNavigate } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { Alert } from "../../../components/ui/Alert"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { SelectField } from "../../../components/ui/SelectField"
import { Switch } from "../../../components/ui/Switch"
import { TextField } from "../../../components/ui/TextField"
import { ApiError } from "../../../lib/api"
import { firstName } from "../../../lib/text"
import { useAuth } from "../../auth/AuthContext"
import { useCanteen } from "../../canteens/CanteenContext"
import { updateUser } from "../api"
import { FormNote } from "../components/FormNote"
import { UserLoader } from "../components/UserLoader"
import { editUserSchema, type EditUserFormInput } from "../schemas"
import type { User } from "../types"

// Sem tela no Figma: segue o cartão de Novo usuário. O login e o papel não mudam depois de criados.
function EditUserForm({ user }: { user: User }) {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { canteens } = useCanteen()
  const [formError, setFormError] = useState<string | null>(null)
  const isEmployee = user.role === "EMPLOYEE"
  // A API não deixa ninguém inativar o próprio usuário, então o interruptor nem aparece.
  const isSelf = user.id === currentUser?.id
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormInput>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: user.name, canteenId: user.canteenId ?? "", isActive: user.isActive },
  })
  // A cantina atual aparece mesmo se estiver inativa, para não sumir da lista.
  const canteenOptions = canteens
    .filter((canteen) => canteen.isActive || canteen.id === user.canteenId)
    .map((canteen) => ({ value: canteen.id, label: canteen.name }))

  const onSubmit = handleSubmit(async ({ name, canteenId, isActive }) => {
    setFormError(null)
    try {
      await updateUser(user.id, {
        name,
        ...(isEmployee && { canteenId }),
        ...(!isSelf && { isActive }),
      })
      navigate("/usuarios", {
        replace: true,
        state: { success: `Usuário de ${firstName(name)} atualizado.` },
      })
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Não foi possível salvar o usuário.")
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="px-5 pb-6">
      <Card className="flex flex-col gap-5 p-4.5">
        <h2 className="text-section font-semibold">Dados do usuário</h2>
        <TextField label="Nome completo" error={errors.name?.message} {...register("name")} />
        <TextField
          label="Usuário"
          value={user.username}
          disabled
          readOnly
          hint="O login não pode ser alterado."
        />
        {isEmployee && (
          <SelectField
            label="Cantina"
            options={canteenOptions}
            error={errors.canteenId?.message}
            {...register("canteenId")}
          />
        )}
        {!isSelf && (
          <Switch
            label="Usuário ativo"
            description="Usuários inativos não conseguem entrar no sistema."
            {...register("isActive")}
          />
        )}
        {formError && <Alert>{formError}</Alert>}
        <Button type="submit" loading={isSubmitting}>
          <Check className="size-4.5" strokeWidth={1.5} aria-hidden />
          Salvar alterações
        </Button>
        <FormNote>
          {isEmployee
            ? "Funcionários acessam apenas sua cantina."
            : "Administradores acessam todas as cantinas."}
        </FormNote>
      </Card>
    </form>
  )
}

export function EditUserPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Editar usuário"
        subtitle="Atualize os dados e o acesso do usuário."
        back={{ to: "/usuarios", label: "Gerenciar usuários" }}
      />
      <UserLoader>{(user) => <EditUserForm user={user} />}</UserLoader>
    </PageContainer>
  )
}
