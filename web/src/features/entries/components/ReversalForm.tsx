import { useState } from "react"
import { Alert } from "../../../components/ui/Alert"
import { Button } from "../../../components/ui/Button"
import { Card } from "../../../components/ui/Card"
import { TextField } from "../../../components/ui/TextField"
import { useIdempotencyKey } from "../../../hooks/useIdempotencyKey"
import { ApiError } from "../../../lib/api"
import { reverseEntry } from "../../sales/api"

type ReversalFormProps = {
  canteenId: string
  entryId: string
  // Explica o efeito do estorno, que muda conforme o tipo de lançamento.
  note: string
  onCancel: () => void
  onDone: () => void
}

// O estorno exige justificativa e não apaga nada: a API cria um lançamento inverso, para auditoria.
export function ReversalForm({ canteenId, entryId, note, onCancel, onDone }: ReversalFormProps) {
  const [reason, setReason] = useState("")
  const [fieldError, setFieldError] = useState<string>()
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const keyFor = useIdempotencyKey()

  async function confirm() {
    const text = reason.trim()
    if (!text) {
      setFieldError("Informe o motivo do estorno")
      return
    }
    if (text.length > 500) {
      setFieldError("Texto muito longo")
      return
    }
    setFieldError(undefined)
    setFormError(null)
    setIsSubmitting(true)
    try {
      await reverseEntry(canteenId, entryId, { reason: text, idempotencyKey: keyFor(text) })
      onDone()
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Não foi possível estornar o lançamento.")
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-3.5">
      <TextField
        autoFocus
        label="Motivo do estorno *"
        placeholder="Ex.: valor lançado errado"
        error={fieldError}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <Alert variant="note">{note}</Alert>
      {formError && <Alert>{formError}</Alert>}
      <Button loading={isSubmitting} onClick={confirm}>
        Confirmar estorno
      </Button>
      <Button variant="outline" disabled={isSubmitting} onClick={onCancel}>
        Cancelar
      </Button>
    </Card>
  )
}
