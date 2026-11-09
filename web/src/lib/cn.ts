import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Junta classes condicionais e resolve conflitos do Tailwind: cn("px-4", "px-2") resulta em "px-2".
export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes))
}
