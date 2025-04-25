"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Calendar, Users, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import EnhancedChatbot from "./enhanced-chatbot"

// Types pour les données
interface PopularDestination {
  name: string
  image: string
  rooms: number
  hotelCount: number
}

interface RoomType {
  name: string
  type: string
  image: string
  count: number
}

export default function HomePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  // États pour les données réelles
  const [popularDestinations, setPopularDestinations] = useState<PopularDestination[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(true)
  const [isLoadingRoomTypes, setIsLoadingRoomTypes] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Récupération des destinations populaires
  useEffect(() => {
    const fetchPopularDestinations = async () => {
      try {
        const response = await fetch("/api/popular-destinations")
        if (!response.ok) {
          throw new Error("Failed to fetch popular destinations")
        }
        const data = await response.json()
        setPopularDestinations(data)
      } catch (err) {
        console.error("Error fetching popular destinations:", err)
        setError("Impossible de charger les destinations populaires")
      } finally {
        setIsLoadingDestinations(false)
      }
    }

    fetchPopularDestinations()
  }, [])

  // Récupération des types de chambres
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const response = await fetch("/api/room-types")
        if (!response.ok) {
          throw new Error("Failed to fetch room types")
        }
        const data = await response.json()
        setRoomTypes(data)
      } catch (err) {
        console.error("Error fetching room types:", err)
        setError("Impossible de charger les types de chambres")
      } finally {
        setIsLoadingRoomTypes(false)
      }
    }

    fetchRoomTypes()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/rooms?search=${encodeURIComponent(searchTerm)}`)
  }

  // Fonction pour gérer la recherche depuis le chatbot
  const handleChatbotSearch = (query: string) => {
    if (query) {
      router.push(`/rooms?search=${encodeURIComponent(query)}`)
    }
  }

  // Fonction pour afficher un placeholder pendant le chargement
  const renderLoadingPlaceholders = (count: number) => {
    return Array(count)
      .fill(0)
      .map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="rounded-xl bg-gray-200 aspect-[4/3] mb-3"></div>
          <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      ))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero section */}
      <div className="relative h-[70vh] bg-gray-900">
        <div className="absolute inset-0">
          <img src="/hotel.jpg" alt="Luxury hotel room" className="w-full h-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60" />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">Trouvez votre chambre idéale</h1>
          <p className="text-xl text-white mb-8 max-w-2xl">
            Des milliers de chambres d'hôtel vous attendent pour un séjour inoubliable
          </p>

          {/* Barre de recherche */}
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row">
              <div className="flex-grow p-4 border-b md:border-b-0 md:border-r border-gray-200">
                <div className="flex items-center">
                  <Search className="h-5 w-5 text-gray-500 mr-3" />
                  <input
                    type="text"
                    placeholder="Où voulez-vous séjourner?"
                    className="w-full outline-none text-gray-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="hidden md:flex items-center p-4 border-r border-gray-200">
                <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <span className="block text-sm text-gray-500">Dates</span>
                  <span className="block font-medium">Quand ?</span>
                </div>
              </div>

              <div className="hidden md:flex items-center p-4 border-r border-gray-200">
                <Users className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <span className="block text-sm text-gray-500">Voyageurs</span>
                  <span className="block font-medium">Combien ?</span>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center bg-primary text-white p-4 md:px-8 font-medium hover:bg-primary/90 transition-colors"
              >
                <span className="mr-2">Rechercher</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Destinations populaires */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8">Destinations populaires</h2>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoadingDestinations ? (
            renderLoadingPlaceholders(4)
          ) : popularDestinations.length > 0 ? (
            popularDestinations.map((destination) => (
              <Link
                href={`/rooms?search=${encodeURIComponent(destination.name)}`}
                key={destination.name}
                className="group block relative rounded-xl overflow-hidden aspect-[4/3]"
              >
                <img
                  src={destination.image || "/hotel.jpg"}
                  alt={destination.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <h3 className="text-xl font-bold">{destination.name}</h3>
                  <p>
                    {destination.rooms} chambres • {destination.hotelCount} hôtels
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-8">Aucune destination disponible pour le moment.</div>
          )}
        </div>
      </div>

      {/* Types de chambres */}
      <div className="max-w-7xl mx-auto px-4 py-16 border-t border-gray-100">
        <h2 className="text-2xl font-bold mb-8">Explorez par type de chambre</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoadingRoomTypes ? (
            renderLoadingPlaceholders(4)
          ) : roomTypes.length > 0 ? (
            roomTypes.map((type) => (
              <Link href={`/rooms?search=${encodeURIComponent(type.type)}`} key={type.type} className="group block">
                <div className="rounded-xl overflow-hidden aspect-square mb-3">
                  <img
                    src={type.image || "/hotel.jpg"}
                    alt={type.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h3 className="text-lg font-medium">{type.name}</h3>
                <p className="text-gray-500">{type.count} chambres</p>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-8">Aucun type de chambre disponible pour le moment.</div>
          )}
        </div>
      </div>

      {/* Call to action */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à réserver votre chambre ?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Découvrez notre sélection de chambres et trouvez celle qui vous convient parfaitement.
          </p>
          <Link
            href="/rooms"
            className="inline-flex items-center justify-center bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Voir toutes les chambres
          </Link>
        </div>
      </div>

      {/* Chatbot amélioré */}
      <EnhancedChatbot
        pageType="home"
        onSearch={handleChatbotSearch}
        botName="Match Room Assistant"
        accentColor="#6366f1"
        position="bottom-right"
        initialMessage="Bonjour ! Je suis votre assistant Match Room. Comment puis-je vous aider à trouver votre logement idéal ?"
      />
    </div>
  )
}
