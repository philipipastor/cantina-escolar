import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, Pencil, RotateCcw, Trash2, type LucideIcon } from "lucide-react"
import { Alert } from "../../../components/ui/Alert"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { TextField } from "../../../components/ui/TextField"
import { ApiError } from "../../../lib/api"
import { cn } from "../../../lib/cn"
import { updateCanteen } from "../api"
import { canteenSchema, type CanteenFormInput } from "../schemas"
import type { Canteen } from "../types"

const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : "Não foi possível salvar. Tente novamente."

function CardAction({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: LucideIcon
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-6.25 items-center gap-1.5 text-mini font-medium text-muted transition hover:text-ink disabled:opacity-60"
    >
      <Icon className="size-3.75" strokeWidth={1.5} aria-hidden />
      {label}
    </button>
  )
}

function RenameForm({
  canteen,
  onCancel,
  onSaved,
}: {
  canteen: Canteen
  onCancel: () => void
  onSaved: () => void
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CanteenFormInput>({
    resolver: zodResolver(canteenSchema),
    defaultValues: { name: canteen.name },
  })

  const onSubmit = handleSubmit(async ({ name }) => {
    setFormError(null)
    try {
      await updateCanteen(canteen.id, { name })
      onSaved()
    } catch (error) {
      setFormError(errorMessage(error))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <TextField label="Nome da empresa *" autoFocus error={errors.name?.message} {...register("name")} />
      {formError && <Alert>{formError}</Alert>}
      <Button type="submit" loading={isSubmitting}>
        Salvar alterações
      </Button>
      <Button variant="outline" disabled={isSubmitting} onClick={onCancel}>
        Cancelar
      </Button>
    </form>
  )
}

type CanteenCardProps = {
  canteen: Canteen
  // Avisa a página de que os dados mudaram, para buscar a lista de novo.
  onChanged: () => void
}

// Editar e inativar acontecem dentro do próprio cartão, porque o Figma não tem uma tela só para isso.
export function CanteenCard({ canteen, onChanged }: CanteenCardProps) {
  const [mode, setMode] = useState<"view" | "rename" | "confirm">("view")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function changeStatus(isActive: boolean) {
    setError(null)
    setIsSaving(true)
    try {
      await updateCanteen(canteen.id, { isActive })
      setMode("view")
      onChanged()
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-3.5">
      <div className="flex items-center gap-3">
        <div className="flex size-10.5 shrink-0 items-center justify-center rounded-[10px] bg-page text-muted">
          <Building2 className="size-5.75" strokeWidth={1.5} aria-hidden />
        </div>
        <p className="min-w-0 flex-1 truncate text-small font-semibold">{canteen.name}</p>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.25 py-1 text-mini font-medium",
            canteen.isActive ? "bg-success-soft text-success" : "bg-avatar text-muted",
          )}
        >
          {canteen.isActive ? "Ativa" : "Inativa"}
        </span>
      </div>
      <hr className="border-line" />

      {mode === "rename" && (
        <RenameForm
          canteen={canteen}
          onCancel={() => setMode("view")}
          onSaved={() => {
            setMode("view")
            onChanged()
          }}
        />
      )}

      {mode === "confirm" && (
        <div className="flex flex-col gap-3">
          <Alert variant="note">
            Os funcionários desta cantina não vão mais conseguir entrar. Nenhum dado é apagado, e você pode
            reativá-la depois.
          </Alert>
          <Button loading={isSaving} onClick={() => changeStatus(false)}>
            Inativar cantina
          </Button>
          <Button variant="outline" disabled={isSaving} onClick={() => setMode("view")}>
            Cancelar
          </Button>
        </div>
      )}

      {mode === "view" && (
        <div className="flex items-start gap-6">
          <CardAction icon={Pencil} label="Editar" disabled={isSaving} onClick={() => setMode("rename")} />
          {canteen.isActive ? (
            <CardAction
              icon={Trash2}
              label="Inativar"
              disabled={isSaving}
              onClick={() => {
                setError(null)
                setMode("confirm")
              }}
            />
          ) : (
            <CardAction
              icon={RotateCcw}
              label="Reativar"
              disabled={isSaving}
              onClick={() => changeStatus(true)}
            />
          )}
        </div>
      )}

      {error && <Alert>{error}</Alert>}
    </Card>
  )
}
