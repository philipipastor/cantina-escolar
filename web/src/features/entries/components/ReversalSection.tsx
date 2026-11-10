import { useState } from "react"
import { Info, RotateCcw } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { Button } from "../../../components/ui/Button"
import { useCurrentCanteen } from "../../canteens/CanteenContext"
import type { Entry } from "../../sales/types"
import { ReversalForm } from "./ReversalForm"

export type RedoTexts = {
  // Tela que abre o formulário preenchido com os dados do lançamento estornado.
  url: string
  label: string
  doneLabel: string
  hint: string
}

type ReversalSectionProps = {
  entry: Entry
  reversalNote: string
  redo: RedoTexts
  onReversed: () => void
}

/**
 * Lançamento não se edita: para corrigir, estorna e refaz. Esta parte mostra o passo em que o
 * lançamento está: pode estornar, já foi estornado (pode refazer) ou já foi refeito (mostra o novo).
 */
export function ReversalSection({ entry, reversalNote, redo, onReversed }: ReversalSectionProps) {
  const canteen = useCurrentCanteen()
  const navigate = useNavigate()
  const [isReversing, setIsReversing] = useState(false)

  if (entry.isReversed) {
    return entry.redoneAsId ? (
      <Link
        to={`/lancamentos/${entry.redoneAsId}`}
        className="text-center text-small font-semibold text-primary hover:underline"
      >
        {redo.doneLabel}
      </Link>
    ) : (
      <Button variant="outline" onClick={() => navigate(redo.url)}>
        <RotateCcw className="size-4.5" strokeWidth={1.5} aria-hidden />
        {redo.label}
      </Button>
    )
  }

  if (isReversing) {
    return (
      <ReversalForm
        canteenId={canteen.id}
        entryId={entry.id}
        note={reversalNote}
        onCancel={() => setIsReversing(false)}
        onDone={() => {
          setIsReversing(false)
          onReversed()
        }}
      />
    )
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsReversing(true)}>
        <RotateCcw className="size-4.5" strokeWidth={1.5} aria-hidden />
        Estornar lançamento
      </Button>
      <p className="flex items-center gap-2 rounded-field bg-avatar px-3 py-2.5 text-caption text-muted">
        <Info className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
        {redo.hint}
      </p>
    </>
  )
}
