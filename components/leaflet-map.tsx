"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

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
}

interface LeafletMapProps {
  filteredRooms: Room[]
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

export default function LeafletMap({ filteredRooms }: LeafletMapProps) {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch hotels data
  useEffect(() => {
    let isMounted = true

    async function fetchHotels() {
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
  }, [])

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
          <MapComponent filteredRooms={filteredRooms} hotels={hotels} />
          <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-md p-3 text-sm">
            <p className="font-medium">{filteredRooms.length} chambres trouvées</p>
            <p className="text-gray-500 text-xs">{hotels.length} hôtels disponibles</p>
          </div>
        </>
      )}
    </div>
  )
}
