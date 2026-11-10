import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound } from "lucide-react"
import { useNavigate } from "react-router"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { Alert } from "../../../components/ui/Alert"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { TextField } from "../../../components/ui/TextField"
import { ApiError } from "../../../lib/api"
import { firstName } from "../../../lib/text"
import { resetUserPassword } from "../api"
import { FormNote } from "../components/FormNote"
import { UserLoader } from "../components/UserLoader"
import { resetPasswordSchema, type ResetPasswordFormInput } from "../schemas"
import type { User } from "../types"

// Sem tela no Figma: segue o cartão de Novo usuário. Serve para quem esqueceu a senha.
function ResetPasswordForm({ user }: { user: User }) {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "" },
  })

  const onSubmit = handleSubmit(async ({ newPassword }) => {
    setFormError(null)
    try {
      await resetUserPassword(user.id, newPassword)
      navigate("/usuarios", {
        replace: true,
        state: { success: `Senha de ${firstName(user.name)} redefinida. Entregue a nova senha à pessoa.` },
      })
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Não foi possível redefinir a senha.")
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="px-5 pb-6">
      <Card className="flex flex-col gap-5 p-4.5">
        <div className="flex flex-col gap-1">
          <h2 className="text-section font-semibold">{user.name}</h2>
          <p className="text-caption text-muted">Login: {user.username}</p>
        </div>
        <TextField
          label="Nova senha"
          type="password"
          placeholder="Mínimo de 8 caracteres"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        {formError && <Alert>{formError}</Alert>}
        <Button type="submit" loading={isSubmitting}>
          <KeyRound className="size-4.5" strokeWidth={1.5} aria-hidden />
          Redefinir senha
        </Button>
        <FormNote>A pessoa sai de todos os aparelhos e entra de novo com a nova senha.</FormNote>
      </Card>
    </form>
  )
}

export function ResetUserPasswordPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Redefinir senha"
        subtitle="Crie uma nova senha para quem esqueceu a dela."
        back={{ to: "/usuarios", label: "Gerenciar usuários" }}
      />
      <UserLoader>{(user) => <ResetPasswordForm user={user} />}</UserLoader>
    </PageContainer>
  )
}
