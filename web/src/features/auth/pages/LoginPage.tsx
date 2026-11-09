import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Navigate } from "react-router"
import { AppHeader } from "../../../components/layout/AppHeader"
import { PageContainer } from "../../../components/layout/PageContainer"
import { PageHeader } from "../../../components/layout/PageHeader"
import { Alert } from "../../../components/ui/Alert"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { TextField } from "../../../components/ui/TextField"
import { ApiError } from "../../../lib/api"
import { useAuth } from "../AuthContext"
import { loginSchema, type LoginInput } from "../schemas"

export function LoginPage() {
  const { status, signIn } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  if (status === "authenticated") return <Navigate to="/" replace />

  const onSubmit = handleSubmit(async (input) => {
    setFormError(null)
    try {
      await signIn(input)
    } catch (error) {
      // A API responde a mesma mensagem para usuário inexistente e senha errada, de propósito.
      setFormError(error instanceof ApiError ? error.message : "Não foi possível entrar. Tente novamente.")
    }
  })

  return (
    <>
      <AppHeader />
      <PageContainer>
        <PageHeader title="Login" subtitle="Acesse o sistema com seu usuário e senha." />
        <div className="px-5">
          <Card className="p-4.5">
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
              <TextField
                label="Usuário"
                placeholder="Digite seu usuário"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                error={errors.username?.message}
                {...register("username")}
              />
              <TextField
                label="Senha"
                type="password"
                placeholder="Digite sua senha"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register("password")}
              />
              {formError && <Alert>{formError}</Alert>}
              <Button type="submit" loading={isSubmitting}>
                Entrar
              </Button>
            </form>
          </Card>
        </div>
      </PageContainer>
    </>
  )
}
