import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formater une date
export function formatDate(date: Date): string {
  return format(date, "dd/MM/yyyy", { locale: fr })
}

// Calculer la différence en jours entre deux dates
export function calculateDaysDifference(startDate: Date, endDate: Date): number {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  
  // Différence en millisecondes
  const diffTime = Math.abs(end.getTime() - start.getTime())
  // Convertir en jours
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}


// Vérifier si une période chevauche une autre
export function periodsOverlap(
  start1: Date | string, 
  end1: Date | string, 
  start2: Date | string, 
  end2: Date | string
): boolean {
  const s1 = typeof start1 === 'string' ? new Date(start1) : start1
  const e1 = typeof end1 === 'string' ? new Date(end1) : end1
  const s2 = typeof start2 === 'string' ? new Date(start2) : start2
  const e2 = typeof end2 === 'string' ? new Date(end2) : end2
  
  // Convertir en début de jour pour une comparaison précise
  s1.setHours(0, 0, 0, 0)
  e1.setHours(0, 0, 0, 0)
  s2.setHours(0, 0, 0, 0)
  e2.setHours(0, 0, 0, 0)
  
  // Vérifier le chevauchement des périodes
  // Deux périodes se chevauchent si le début de l'une est avant la fin de l'autre
  // et la fin de l'une est après le début de l'autre
  return s1 <= e2 && e1 >= s2
}