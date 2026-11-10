// Erro de um campo que não usa o TextField, como seletores e grupos de opções.
export function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-caption text-primary">{message}</p> : null
}
