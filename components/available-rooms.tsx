"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Star, Heart, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type Room = {
  id: string
  name: string
  price: number
  rate: number
  content: string
  categories: string
  tags: string
  types: {
    type: {
      id: string
      name: string
    }
  }[]
}

interface AvailableRoomsProps {
  rooms: Room[]
}

export default function AvailableRooms({ rooms }: AvailableRoomsProps) {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Fonction pour formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  // Fonction pour ajouter/retirer des favoris
  const toggleFavorite = (e: React.MouseEvent, roomId: string) => {
    e.preventDefault()
    e.stopPropagation()

    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(roomId)) {
        newFavorites.delete(roomId)
      } else {
        newFavorites.add(roomId)
      }
      return newFavorites
    })
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucune chambre disponible pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {rooms.map((room) => (
        <Card key={room.id} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 relative">
              <img
                src="/hotel.jpg"
                alt={room.name}
                className="w-full h-full object-cover aspect-video md:aspect-auto"
              />
              <button onClick={(e) => toggleFavorite(e, room.id)} className="absolute top-3 right-3 z-10">
                <Heart
                  className={`h-6 w-6 ${
                    favorites.has(room.id) ? "fill-red-500 text-red-500" : "text-white stroke-2 drop-shadow-md"
                  }`}
                />
              </button>
            </div>

            <div className="p-6 md:w-2/3">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{room.name}</h3>
                <div className="flex items-center text-sm bg-gray-100 px-2 py-0.5 rounded-md">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span>{room.rate.toFixed(1)}</span>
                </div>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">{room.content}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {room.types.map((typeRel, index) => (
                  <Badge key={index} variant="outline">
                    {typeRel.type.name}
                  </Badge>
                ))}

                {room.categories.split(",").map((category, index) => (
                  <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-800">
                    {category.trim()}
                  </Badge>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-2xl font-bold text-blue-700">{formatPrice(room.price)}</span>
                  <span className="text-gray-500 text-sm"> / nuit</span>
                </div>

                <Button onClick={() => router.push(`/room/${room.id}`)}>
                  Voir les détails
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
