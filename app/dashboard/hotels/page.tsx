"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { HotelsList } from "@/components/hotels-list"
import { Hotel } from "@/models"

export default function HotelsPage() {
  const { user, isLoading } = useAuth()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fonction pour récupérer les hôtels via l'API
    const fetchHotels = async () => {
      if (!user) return

      try {
        const response = await fetch("/api/dashboard/hotels")
        
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des hôtels")
        }
        
        const data = await response.json()
        setHotels(data.hotels)
      } catch (err) {
        console.error("Erreur:", err)
        setError("Impossible de charger la liste des hôtels")
      } finally {
        setDataLoading(false)
      }
    }

    if (!isLoading && user) {
      fetchHotels()
    } else if (!isLoading && !user) {
      setDataLoading(false)
    }
  }, [user, isLoading])

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!isLoading && !user) {
    return <div className="p-4">Veuillez vous connecter pour accéder à la liste des hôtels</div>
  }

  // Afficher un indicateur de chargement pendant que les données sont récupérées
  if (isLoading || dataLoading) {
    return <div className="p-4">Chargement...</div>
  }

  // Afficher un message d'erreur si la récupération des données a échoué
  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Your Hotels</h2>
        <Link href="/dashboard/hotels/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Hotel
          </Button>
        </Link>
      </div>
      <HotelsList hotels={hotels} />
    </div>
  )
}