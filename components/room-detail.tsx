"use client"

import { ArrowLeft, Check, Euro, Heart, MapPin, Share, Star, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

// Types
type RoomType = {
  id: string
  name: string
}

type HotelType = {
  id: string
  name: string
  address: string
  city: string
  zipCode: string
  phone: string
  rate: number
}

type RoomWithRelations = {
  id: string
  name: string
  price: number
  rate: number
  maxOccupancy: number
  content: string
  categories: string
  tags: string
  hotelId: string
  createdAt: string
  updatedAt: string
  hotel: HotelType
  types: {
    type: RoomType
  }[]
}

type RoomParams = {
  id: string
}

export default function RoomDetail({ params }: { params: RoomParams }) {
  // Déballer les paramètres avec use() et le bon typage
  const unwrappedParams = use(params as unknown as Promise<RoomParams>)
  const roomId = unwrappedParams.id

  const [room, setRoom] = useState<RoomWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [checkInDate, setCheckInDate] = useState<string>("")
  const [checkOutDate, setCheckOutDate] = useState<string>("")
  const [guestCount, setGuestCount] = useState(1)
  const [showAllAmenities, setShowAllAmenities] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    async function fetchRoomData() {
      if (!roomId) {
        if (isMounted) {
          setIsLoading(false)
        }
        return
      }

      try {
        setIsLoading(true)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const res = await fetch(`/api/rooms/${roomId}`, {
          signal: controller.signal,
          cache: "no-store",
        })

        clearTimeout(timeoutId)

        const data = await res.json()

        if (isMounted) {
          setRoom(data)
          setIsLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Une erreur s'est produite")
          setIsLoading(false)
        }
      }
    }

    fetchRoomData()

    return () => {
      isMounted = false
    }
  }, [roomId])

  const toggleFavorite = () => {
    setIsFavorite((prev) => !prev)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % 5)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + 5) % 5)
  }

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!room || !checkInDate || !checkOutDate) return 0

    const start = new Date(checkInDate)
    const end = new Date(checkOutDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return room.price * diffDays
  }

  const totalPrice = calculateTotalPrice()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Chargement des informations...</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-lg px-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-700 mb-6">{error || "Impossible de charger les informations de la chambre"}</p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  const roomTags = room.tags.split(",").map((tag) => tag.trim())
  const roomCategories = room.categories.split(",").map((category) => category.trim())

  // Amenities from tags and categories
  const amenities = [...roomTags, ...roomCategories]
  const displayedAmenities = showAllAmenities ? amenities : amenities.slice(0, 8)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête avec bouton retour */}
      <div className="mb-6">
        <Link href="/rooms" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux chambres
        </Link>
      </div>

      {/* Titre et actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium">{room.name}</h1>
          <div className="flex items-center mt-1 text-sm">
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-current text-black mr-1" />
              <span className="font-medium mr-1">{room.rate}</span>
            </div>
            <span className="mx-2">•</span>
            <span className="text-gray-600 underline">
              {room.hotel.city}, {room.hotel.zipCode}
            </span>
          </div>
        </div>

        <div className="flex items-center mt-4 md:mt-0 space-x-4">
          <button className="flex items-center text-sm font-medium hover:underline">
            <Share className="h-4 w-4 mr-2" />
            Partager
          </button>
          <button onClick={toggleFavorite} className="flex items-center text-sm font-medium hover:underline">
            <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-primary text-primary" : ""}`} />
            Enregistrer
          </button>
        </div>
      </div>

      {/* Galerie d'images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8">
        <div className="relative rounded-l-xl overflow-hidden aspect-[4/3]">
          <img src="/hotel.jpg" alt={room.name} className="w-full h-full object-cover" />
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md opacity-0 hover:opacity-100 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`relative overflow-hidden ${i === 1 ? "rounded-tr-xl" : i === 3 ? "rounded-br-xl" : ""}`}
            >
              <img src="/hotel.jpg" alt={`Vue ${i + 2}`} className="w-full h-full object-cover aspect-square" />
              {i === 3 && (
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md opacity-0 hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Informations principales */}
        <div className="lg:col-span-2">
          {/* Hôtel et hôte */}
          <div className="flex justify-between items-start pb-6 border-b">
            <div>
              <h2 className="text-xl font-medium">Chambre dans l'hôtel {room.hotel.name}</h2>
              <p className="text-gray-600 mt-1">
                <MapPin className="inline-block h-4 w-4 mr-1" />
                {room.hotel.address}, {room.hotel.city} {room.hotel.zipCode}
              </p>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">{room.maxOccupancy} voyageurs maximum</span> •{" "}
                {room.types.map((t) => t.type.name).join(", ")}
              </p>
            </div>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-6 w-6 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="py-6 border-b">
            <h2 className="text-xl font-medium mb-4">À propos de cette chambre</h2>
            <p className="text-gray-700 whitespace-pre-line">{room.content}</p>
          </div>

          {/* Caractéristiques */}
          <div className="py-6 border-b">
            <h2 className="text-xl font-medium mb-4">Ce que propose cette chambre</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayedAmenities.map((amenity, index) => (
                <div key={index} className="flex items-center">
                  <Check className="h-5 w-5 mr-3 text-gray-500" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
            {amenities.length > 8 && (
              <button
                onClick={() => setShowAllAmenities(!showAllAmenities)}
                className="mt-4 px-4 py-2 border border-gray-900 rounded-lg font-medium text-sm hover:bg-gray-100"
              >
                {showAllAmenities
                  ? "Afficher moins"
                  : `Afficher les ${amenities.length - 8} équipements supplémentaires`}
              </button>
            )}
          </div>

          {/* Catégories */}
          <div className="py-6">
            <h2 className="text-xl font-medium mb-4">Catégories</h2>
            <div className="flex flex-wrap gap-2">
              {roomCategories.map((category, index) => (
                <span
                  key={`cat-${index}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          {/* Informations sur l'hôtel */}
          <div className="py-6 border-t">
            <h2 className="text-xl font-medium mb-4">À propos de l'hôtel</h2>
            <div className="flex items-start mb-4">
              <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center mr-4">
                <img src="/hotel.jpg" alt={room.hotel.name} className="w-full h-full object-cover rounded-lg" />
              </div>
              <div>
                <h3 className="font-medium">{room.hotel.name}</h3>
                <div className="flex items-center mt-1">
                  <Star className="h-4 w-4 fill-current text-black mr-1" />
                  <span className="font-medium mr-1">{room.hotel.rate}</span>
                </div>
                <p className="text-gray-600 text-sm mt-1">{room.hotel.phone}</p>
              </div>
            </div>
            <Link href={`/dashboard/hotels/${room.hotel.id}`} className="text-primary font-medium hover:underline">
              Voir plus d'informations sur cet hôtel
            </Link>
          </div>
        </div>

        {/* Réservation */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 border border-gray-200 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-xl font-semibold">{room.price} €</span>
                <span className="text-gray-500"> / nuit</span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-current text-black mr-1" />
                <span className="font-medium">{room.rate}</span>
              </div>
            </div>

            <div className="border border-gray-300 rounded-t-lg overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-gray-300">
                <div className="p-3">
                  <label className="block text-xs font-semibold">ARRIVÉE</label>
                  <input
                    type="date"
                    className="w-full border-none p-0 text-sm focus:ring-0"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                  />
                </div>
                <div className="p-3">
                  <label className="block text-xs font-semibold">DÉPART</label>
                  <input
                    type="date"
                    className="w-full border-none p-0 text-sm focus:ring-0"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="border-t border-gray-300 p-3">
                <label className="block text-xs font-semibold">VOYAGEURS</label>
                <select
                  className="w-full border-none p-0 text-sm focus:ring-0"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number.parseInt(e.target.value))}
                >
                  {[...Array(room.maxOccupancy)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} voyageur{i > 0 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button className="w-full mt-4 py-3 rounded-lg bg-gradient-to-r from-[#E61E4D] to-[#D70466] hover:from-[#D70466] hover:to-[#BD1E59] text-white font-medium">
              Réserver
            </Button>

            {checkInDate && checkOutDate && (
              <div className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="underline">
                    {room.price} € x {totalPrice / room.price} nuits
                  </span>
                  <span>{totalPrice} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="underline">Frais de service</span>
                  <span>{Math.round(totalPrice * 0.12)} €</span>
                </div>
                <div className="flex justify-between font-semibold pt-3 border-t">
                  <span>Total</span>
                  <span>{totalPrice + Math.round(totalPrice * 0.12)} €</span>
                </div>
              </div>
            )}

            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full border-gray-300 hover:border-gray-500 rounded-lg"
                onClick={() => {
                  // Implement negotiation logic
                }}
              >
                <Euro className="h-4 w-4 mr-2" />
                Proposer un prix
              </Button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">Vous ne serez pas débité pour le moment</p>
          </div>
        </div>
      </div>
    </div>
  )
}
