"use client"

import { Loader2 } from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

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
  hotel?: Hotel
}

interface LeafletMapProps {
  filteredRooms?: Room[]
  filteredHotels?: Hotel[]
}

const MapComponent = dynamic(() => import("./map-client"), {
  ssr: false,
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

  useEffect(() => {
    let isMounted = true

    async function fetchHotels() {
      if (filteredHotels && filteredHotels.length > 0) {
        setHotels(filteredHotels)
        setIsLoading(false)
        return
      }

      if (filteredRooms && filteredRooms.length > 0 && filteredRooms[0].hotel) {
        const uniqueHotels = Array.from(new Set(
          filteredRooms.map(room => room.hotel?.id)
        )).map(hotelId =>
          filteredRooms.find(room => room.hotel?.id === hotelId)?.hotel
        ).filter(hotel => hotel !== undefined) as Hotel[];

        if (uniqueHotels.length > 0) {
          setHotels(uniqueHotels);
          setIsLoading(false);
          return;
        }
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

    return () => {
      isMounted = false
    }
  }, [filteredHotels, filteredRooms])

  const roomsCount = filteredRooms?.length || 0
  const hotelsCount = filteredHotels?.length || hotels.length

  const displayMode = filteredRooms && filteredRooms.length > 0 ? 'rooms' : 'hotels';

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
            {displayMode === 'rooms' && roomsCount > 0 ? (
              <p className="font-medium text-blue-700">{roomsCount} chambre{roomsCount > 1 ? 's' : ''} sur la carte</p>
            ) : (
              <p className="font-medium text-blue-700">{hotelsCount} hôtel{hotelsCount > 1 ? 's' : ''} sur la carte</p>
            )}
            <p className="text-gray-600 text-xs mt-1">
              {displayMode === 'rooms' ?
                `Affichage des chambres` :
                `Affichage des hôtels`
              }
            </p>
          </div>
        </>
      )}<div className="flex h-full items-center justify-center bg-gray-50">
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
          {displayMode === 'rooms' && roomsCount > 0 ? (
            <p className="font-medium text-blue-700">{roomsCount} chambre{roomsCount > 1 ? 's' : ''} sur la carte</p>
          ) : (
            <p className="font-medium text-blue-700">{hotelsCount} hôtel{hotelsCount > 1 ? 's' : ''} sur la carte</p>
          )}
          <p className="text-gray-600 text-xs mt-1">
            {displayMode === 'rooms' ?
              `Affichage des chambres` :
              `Affichage des hôtels`
            }
          </p>
        </div>
      </>
      )
    </div>
  )
}