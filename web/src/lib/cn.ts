import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * O tailwind-merge precisa conhecer os tokens do projeto. Sem isso, ele acha que "text-nav" é uma cor
 * e a remove ao encontrar "text-muted", fazendo o texto perder o tamanho.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "title",
        "entry",
        "figure",
        "greeting",
        "total",
        "hero",
        "metric",
        "price",
        "amount",
        "stat",
        "currency",
        "lead",
        "section",
        "body",
        "small",
        "caption",
        "mini",
        "nav",
      ],
      radius: ["field", "card", "brand"],
    },
  },
})

// Junta classes condicionais e resolve conflitos do Tailwind: cn("px-4", "px-2") resulta em "px-2".
export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes))
}
