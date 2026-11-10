import { useState } from "react"
import { Plus } from "lucide-react"
import { TextField } from "../../../components/ui/TextField"

// Campo com o botão "+" do Figma. Enter também adiciona, sem enviar o formulário inteiro.
export function AddChildField({ onAdd, disabled }: { onAdd: (name: string) => void; disabled?: boolean }) {
  const [name, setName] = useState("")

  function add() {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName("")
  }

  return (
    <div className="flex items-start gap-2">
      <TextField
        label="Nome do filho"
        placeholder="Ex.: Pedro"
        hint="Opcional. Adicione quantos filhos desejar."
        className="flex-1"
        value={name}
        maxLength={150}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            add()
          }
        }}
      />
      <button
        type="button"
        onClick={add}
        disabled={disabled}
        aria-label="Adicionar filho"
        className="mt-7 flex size-12.5 shrink-0 items-center justify-center rounded-field bg-primary-soft text-primary transition hover:bg-primary-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
      >
        <Plus className="size-5" aria-hidden />
      </button>
    </div>
  )
}
