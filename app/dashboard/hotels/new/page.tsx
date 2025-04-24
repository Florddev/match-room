"use client"

import { HotelForm } from "../form"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"

export default function NewHotelPage() {
  const { user, isLoading } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isLoading) {
      setIsAuthorized(!!user)
    }
  }, [user, isLoading])

  // Pendant le chargement, afficher un état de chargement
  if (isLoading || isAuthorized === null) {
    return <div>Chargement...</div>
  }

  // Si l'utilisateur n'est pas connecté
  if (!isAuthorized) {
    return <div>Veuillez vous connecter pour ajouter un hôtel</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Add New Hotel</h2>
      <HotelForm />
    </div>
  )
}