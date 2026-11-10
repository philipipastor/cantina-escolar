import { ChevronLeft } from "lucide-react"
import { Link } from "react-router"

export function BackToStatement({ clientId }: { clientId: string }) {
  return (
    <Link
      to={`/clientes/${clientId}`}
      className="flex w-fit items-center gap-1 text-caption font-semibold text-primary hover:underline"
    >
      <ChevronLeft className="size-4" strokeWidth={1.5} aria-hidden />
      Voltar ao extrato
    </Link>
  )
}
