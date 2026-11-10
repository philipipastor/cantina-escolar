import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "react-router"
import { AppHeader } from "../../../components/layout/AppHeader"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { Alert } from "../../../components/ui/Alert"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { TextField } from "../../../components/ui/TextField"
import { ApiError } from "../../../lib/api"
import { changePassword } from "../api"
import { UserMenu } from "../components/UserMenu"
import { changePasswordSchema, type ChangePasswordInput } from "../schemas"

type Feedback = { variant: "success" | "error"; message: string }

export function ChangePasswordPage() {
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) })

  const onSubmit = handleSubmit(async (input) => {
    setFeedback(null)
    try {
      await changePassword(input)
      reset()
      setFeedback({
        variant: "success",
        message: "Senha alterada. Outros aparelhos precisarão entrar de novo.",
      })
    } catch (error) {
      if (error instanceof ApiError && error.code === "WRONG_CURRENT_PASSWORD") {
        setError("currentPassword", { message: error.message })
        return
      }
      const message = error instanceof ApiError ? error.message : "Não foi possível alterar a senha."
      setFeedback({ variant: "error", message })
    }
  })

  return (
    <>
      <AppHeader action={<UserMenu />} />
      <PageContainer>
        <PageHeader title="Troca de senha" subtitle="Atualize sua senha de acesso." />
        <div className="px-5">
          <Card className="p-4.5">
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
              <TextField
                label="Senha atual"
                type="password"
                autoComplete="current-password"
                error={errors.currentPassword?.message}
                {...register("currentPassword")}
              />
              <TextField
                label="Nova senha"
                type="password"
                autoComplete="new-password"
                error={errors.newPassword?.message}
                {...register("newPassword")}
              />
              <TextField
                label="Confirmar nova senha"
                type="password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
              {feedback && <Alert variant={feedback.variant}>{feedback.message}</Alert>}
              <Button type="submit" loading={isSubmitting}>
                Salvar nova senha
              </Button>
              <Link to="/" className="text-center text-small font-medium text-muted hover:text-ink">
                Cancelar
              </Link>
            </form>
          </Card>
        </div>
      </PageContainer>
    </>
  )
}
