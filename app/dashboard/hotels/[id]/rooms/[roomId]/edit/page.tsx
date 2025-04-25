"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { RoomForm } from "../../form"
import { useAuth } from "@/lib/auth-context"
import { Room, RoomType } from "@/models"

export default function EditRoomPage() {
  const { user, isLoading } = useAuth()
  const [room, setRoom] = useState<Room | null>(null)
  const [types, setTypes] = useState<RoomType[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const hotelId = Array.isArray(params.id) ? params.id[0] : params.id
  const roomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId

  useEffect(() => {
    // Fonction pour récupérer les détails de la chambre et les types disponibles
    const fetchRoomDetails = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/dashboard/hotels/${hotelId}/rooms/${roomId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            // Rediriger vers une page 404 si la chambre n'est pas trouvée
            router.push("/404")
            return
          }
          throw new Error("Erreur lors de la récupération des détails de la chambre")
        }
        
        const data = await response.json()
        setRoom(data.room)
        setTypes(data.types)
      } catch (err) {
        console.error("Erreur:", err)
        setError(err instanceof Error ? err.message : "Une erreur est survenue")
      } finally {
        setDataLoading(false)
      }
    }

    if (!isLoading && user) {
      fetchRoomDetails()
    } else if (!isLoading && !user) {
      setDataLoading(false)
    }
  }, [user, isLoading, hotelId, roomId, router])

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!isLoading && !user) {
    return <div className="p-4">Veuillez vous connecter pour modifier les détails de la chambre</div>
  }

  // Afficher un indicateur de chargement pendant que les données sont récupérées
  if (isLoading || dataLoading) {
    return <div className="p-4">Chargement...</div>
  }

  // Afficher un message d'erreur si la récupération des données a échoué
  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  // Gérer le cas où la chambre n'est pas trouvée
  if (!room) {
    return <div className="p-4">Chambre non trouvée ou vous n'avez pas l'autorisation d'y accéder</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Edit Room</h2>
      <RoomForm hotelId={hotelId ?? ''} room={room} types={types} />
    </div>
  )
}