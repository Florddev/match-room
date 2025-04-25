"use client"

import { Loader2 } from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

// Types pour les chambres et hôtels
type Hotel = {
  id: string
  name: string
  rate: number
  address: string
  city: string
  zipCode: string
  phone: string
  rooms?: Room[]
}

type Room = {
  id: string
  name: string
  price: number
  rate: number
  content: string
  categories: string
  tags: string
  hotelId: string
  hotel?: Hotel // Relation optionnelle vers l'hôtel parent
}

interface LeafletMapProps {
  // Accepte soit des rooms, soit des hotels, soit les deux
  filteredRooms?: Room[]
  filteredHotels?: Hotel[]
}

// Composant qui sera chargé seulement côté client
const MapComponent = dynamic(() => import("./map-client"), {
  ssr: false, // Important : désactive le rendu côté serveur
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="mt-2 text-sm text-gray-600">Chargement de la carte...</p>
      </div>
    </div>
  ),
})

export default function LeafletMap({ filteredRooms, filteredHotels }: LeafletMapProps) {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch hotels data if needed
  useEffect(() => {
    let isMounted = true

    async function fetchHotels() {
      // Si des hôtels sont déjà fournis via les props, pas besoin de les récupérer
      if (filteredHotels && filteredHotels.length > 0) {
        setHotels(filteredHotels)
        setIsLoading(false)
        return
      }

      try {
        console.log("Fetching hotels data...")
        const res = await fetch("/api/hotels", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) throw new Error("Erreur lors du chargement des hôtels")

        const data: Hotel[] = await res.json()
        console.log(`Loaded ${data.length} hotels`)

        if (!isMounted) return

        setHotels(data)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching hotels:", error)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchHotels()

    // Clean up function
    return () => {
      isMounted = false
    }
  }, [filteredHotels])

  // Calcule combien d'éléments seront affichés sur la carte
  const roomsCount = filteredRooms?.length || 0
  const hotelsCount = filteredHotels?.length || hotels.length

  return (
    <div className="h-full w-full relative">
      {isLoading ? (
        <div className="flex h-full items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      ) : (
        <>
          <MapComponent
            filteredRooms={filteredRooms || []}
            hotels={filteredHotels || hotels}
          />
          <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-md p-3 text-sm">
            {roomsCount > 0 && (
              <p className="font-medium">{roomsCount} chambre{roomsCount > 1 ? 's' : ''} trouvée{roomsCount > 1 ? 's' : ''}</p>
            )}
            <p className="text-gray-500 text-xs">{hotelsCount} hôtel{hotelsCount > 1 ? 's' : ''} disponible{hotelsCount > 1 ? 's' : ''}</p>
          </div>
        </>
      )}
    </div>
  )
}