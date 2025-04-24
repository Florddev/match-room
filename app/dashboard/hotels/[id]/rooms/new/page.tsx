"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { RoomForm } from "../form"
import { useAuth } from "@/lib/auth-context"
import { Hotel, RoomType } from "@/models"

export default function NewRoomPage() {
  const { user, isLoading } = useAuth()
  const [types, setTypes] = useState<RoomType[]>([])
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const hotelId = Array.isArray(params.id) ? params.id[0] : params.id

  useEffect(() => {
    // Fonction pour récupérer les types de chambres et vérifier l'autorisation
    const fetchRoomTypesAndHotel = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/dashboard/hotels/${hotelId}/room-types`)
        
        if (!response.ok) {
          if (response.status === 404) {
            // Rediriger vers une page 404 si l'hôtel n'est pas trouvé
            router.push("/404")
            return
          }
          throw new Error("Erreur lors de la récupération des données")
        }
        
        const data = await response.json()
        setHotel(data.hotel)
        setTypes(data.types)
      } catch (err) {
        console.error("Erreur:", err)
        setError(err instanceof Error ? err.message : "Une erreur est survenue")
      } finally {
        setDataLoading(false)
      }
    }

    if (!isLoading && user) {
      fetchRoomTypesAndHotel()
    } else if (!isLoading && !user) {
      setDataLoading(false)
    }
  }, [user, isLoading, hotelId, router])

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!isLoading && !user) {
    return <div className="p-4">Veuillez vous connecter pour ajouter une chambre</div>
  }

  // Afficher un indicateur de chargement pendant que les données sont récupérées
  if (isLoading || dataLoading) {
    return <div className="p-4">Chargement...</div>
  }

  // Afficher un message d'erreur si la récupération des données a échoué
  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  // Gérer le cas où l'hôtel n'est pas trouvé
  if (!hotel) {
    return <div className="p-4">Hôtel non trouvé ou vous n'avez pas l'autorisation d'y accéder</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Add New Room</h2>
      <RoomForm hotelId={hotelId ?? ''} types={types} />
    </div>
  )
}