"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { HotelForm } from "../../form"
import { useParams } from "next/navigation"
import type { Hotel } from "@/models"

export default function EditHotelPage() {
  const { user, isLoading } = useAuth()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const hotelId = Array.isArray(params.id) ? params.id[0] : params.id

  useEffect(() => {
    // Fonction pour récupérer les détails de l'hôtel via l'API
    const fetchHotelDetails = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/dashboard/hotels/${hotelId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Hôtel non trouvé")
          }
          throw new Error("Erreur lors de la récupération des détails de l'hôtel")
        }
        
        const data = await response.json()
        setHotel(data.hotel)
      } catch (err) {
        console.error("Erreur:", err)
        setError(err instanceof Error ? err.message : "Une erreur est survenue")
      } finally {
        setDataLoading(false)
      }
    }

    if (!isLoading && user) {
      fetchHotelDetails()
    } else if (!isLoading && !user) {
      setDataLoading(false)
    }
  }, [user, isLoading, hotelId])

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!isLoading && !user) {
    return <div>Veuillez vous connecter pour modifier cet hôtel</div>
  }

  // Afficher un indicateur de chargement pendant que les données sont récupérées
  if (isLoading || dataLoading) {
    return <div>Chargement...</div>
  }

  // Afficher un message d'erreur si la récupération des données a échoué
  if (error) {
    return <div>{error}</div>
  }

  // Afficher un message si l'hôtel n'a pas été trouvé
  if (!hotel) {
    return <div>Hôtel non trouvé ou vous n'avez pas l'autorisation d'y accéder</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Edit Hotel</h2>
      <HotelForm hotel={hotel} />
    </div>
  )
}