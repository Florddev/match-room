"use client"
import { Heart, Star, Tag } from "lucide-react"
import type React from "react"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

type Room = {
  id: string
  name: string
  price: number
  rate: number
  content: string
  categories: string
  tags: string
  hotelId: string
  createdAt: string
  updatedAt: string
}

interface RoomListProps {
  searchTerm: string
  onFilteredRoomsChange?: (rooms: Room[]) => void
}

export default function RoomList({ searchTerm, onFilteredRoomsChange }: RoomListProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [currentImageIndexes, setCurrentImageIndexes] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Mémorise la fonction de callback pour éviter les rendus infinis
  const updateParentWithFilteredRooms = useCallback(
    (roomsToUpdate: Room[]) => {
      if (onFilteredRoomsChange) {
        onFilteredRoomsChange(roomsToUpdate)
      }
    },
    [onFilteredRoomsChange],
  )

  // Fetch rooms data only once
  useEffect(() => {
    let isMounted = true

    async function fetchRooms() {
      try {
        console.log("Récupération des données des chambres...")

        // Ajouter un timeout pour éviter les blocages infinis
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const res = await fetch("/api/rooms", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          cache: "no-store", // Éviter les problèmes de cache
        })

        clearTimeout(timeoutId)

        if (!res.ok) {
          throw new Error(`Erreur lors du chargement des chambres: ${res.status}`)
        }

        const data: Room[] = await res.json()
        console.log(`${data.length} chambres récupérées`)

        if (!isMounted) return

        // S'assurer que chaque chambre a un ID valide
        const validRooms = data.filter((room) => room.id && typeof room.id === "string" && room.id.trim() !== "")

        if (validRooms.length !== data.length) {
          console.warn(`Filtrage de ${data.length - validRooms.length} chambres avec ID invalide`)
        }

        // Initialize image indexes
        const initialIndexes: Record<string, number> = {}
        validRooms.forEach((room) => {
          initialIndexes[room.id] = 0
        })

        setCurrentImageIndexes(initialIndexes)
        setRooms(validRooms)
        setFilteredRooms(validRooms)
        updateParentWithFilteredRooms(validRooms)
        setIsLoading(false)
        setFetchError(null)
      } catch (error) {
        console.error("Erreur lors de la récupération des chambres:", error)
        if (isMounted) {
          setIsLoading(false)
          setFetchError(error instanceof Error ? error.message : "Une erreur s'est produite")
        }
      }
    }

    fetchRooms()

    // Clean up function
    return () => {
      isMounted = false
    }
  }, []) // Dépendances vides - s'exécute seulement au montage

  // Filtrer les chambres lorsque le terme de recherche change
  useEffect(() => {
    if (rooms.length === 0) return

    const similarityThreshold = 0.5
    const term = searchTerm.trim()

    if (term === "") {
      setFilteredRooms(rooms)
      updateParentWithFilteredRooms(rooms)
      return
    }

    const searchWords = term.toLowerCase().split(/\s+/)

    const results = rooms.filter((room) => {
      return searchWords.some((word) => {
        const nameSimilarity = Math.max(
          ...room.name
            .toLowerCase()
            .split(/\s+/)
            .map((nameWord) => calculateSimilarity(word, nameWord)),
          0,
        )

        const contentSimilarity = Math.max(
          ...room.content
            .toLowerCase()
            .split(/\s+/)
            .map((contentWord) => calculateSimilarity(word, contentWord)),
          0,
        )

        const categoriesSimilarity = Math.max(
          ...room.categories
            .toLowerCase()
            .split(/\s+/)
            .map((catWord) => calculateSimilarity(word, catWord)),
          0,
        )

        const tagsSimilarity = Math.max(
          ...room.tags
            .toLowerCase()
            .split(/\s+/)
            .map((tagWord) => calculateSimilarity(word, tagWord)),
          0,
        )

        const priceStr = room.price.toString()
        const priceSimilarity = calculateSimilarity(word, priceStr)

        const rateStr = room.rate.toString()
        const rateSimilarity = calculateSimilarity(word, rateStr)

        return (
          nameSimilarity >= similarityThreshold ||
          contentSimilarity >= similarityThreshold ||
          categoriesSimilarity >= similarityThreshold ||
          tagsSimilarity >= similarityThreshold ||
          priceSimilarity >= similarityThreshold ||
          rateSimilarity >= similarityThreshold
        )
      })
    })

    const sortedResults = results.sort((a, b) => {
      const aRelevance = calculateOverallRelevance(a, searchWords)
      const bRelevance = calculateOverallRelevance(b, searchWords)
      return bRelevance - aRelevance
    })

    setFilteredRooms(sortedResults)
    updateParentWithFilteredRooms(sortedResults)
  }, [searchTerm, rooms, updateParentWithFilteredRooms])

  // Reusing your existing search logic with Levenshtein distance
  function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = a[j - 1] === b[i - 1] ? 0 : 1
        matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost)
      }
    }

    return matrix[b.length][a.length]
  }

  function calculateSimilarity(term: string, text: string): number {
    if (!term || !text) return 0
    const distance = levenshteinDistance(term.toLowerCase(), text.toLowerCase())
    const maxLength = Math.max(term.length, text.length)
    return 1 - distance / maxLength
  }

  function calculateOverallRelevance(room: Room, searchWords: string[]): number {
    let totalRelevance = 0

    searchWords.forEach((word) => {
      const nameSimilarities = room.name
        .toLowerCase()
        .split(/\s+/)
        .map((nameWord) => calculateSimilarity(word, nameWord))

      const contentSimilarities = room.content
        .toLowerCase()
        .split(/\s+/)
        .map((contentWord) => calculateSimilarity(word, contentWord))

      const categoriesSimilarities = room.categories
        .toLowerCase()
        .split(/\s+/)
        .map((catWord) => calculateSimilarity(word, catWord))

      const tagsSimilarities = room.tags
        .toLowerCase()
        .split(/\s+/)
        .map((tagWord) => calculateSimilarity(word, tagWord))

      const priceStr = room.price.toString()
      const priceSimilarity = calculateSimilarity(word, priceStr)

      const rateStr = room.rate.toString()
      const rateSimilarity = calculateSimilarity(word, rateStr)

      totalRelevance += Math.max(...nameSimilarities, 0) * 3
      totalRelevance += Math.max(...contentSimilarities, 0) * 2
      totalRelevance += Math.max(...categoriesSimilarities, 0) * 2.5
      totalRelevance += Math.max(...tagsSimilarities, 0) * 2
      totalRelevance += priceSimilarity * 1.5
      totalRelevance += rateSimilarity * 1
    })

    return totalRelevance
  }

  const toggleFavorite = (e: React.MouseEvent, roomId: string) => {
    e.preventDefault() // Empêcher la navigation lors du clic sur le bouton favori
    e.stopPropagation() // Empêcher la propagation vers le parent

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

  const handleImageNav = (e: React.MouseEvent, roomId: string, direction: "prev" | "next") => {
    e.preventDefault() // Empêcher la navigation
    e.stopPropagation() // Empêcher la propagation vers le parent

    if (direction === "prev") {
      setCurrentImageIndexes((prev) => ({
        ...prev,
        [roomId]: (prev[roomId] - 1 + 5) % 5, // Assuming 5 images per room
      }))
    } else {
      setCurrentImageIndexes((prev) => ({
        ...prev,
        [roomId]: (prev[roomId] + 1) % 5, // Assuming 5 images per room
      }))
    }
  }

  // Types de chambres pour le filtrage rapide
  const roomTypes = [
    { name: "Tous", icon: "🏠" },
    { name: "Chambre simple", icon: "🛏️" },
    { name: "Suite", icon: "✨" },
    { name: "Familiale", icon: "👨‍👩‍👧‍👦" },
    { name: "Vue mer", icon: "🌊" },
    { name: "Économique", icon: "💰" },
    { name: "Luxe", icon: "👑" },
  ]

  return (
    <div className="max-w-full mx-auto">
      {/* Types de chambres */}
      <div className="flex overflow-x-auto pb-4 mb-6 scrollbar-hide">
        <div className="flex space-x-8">
          {roomTypes.map((type) => (
            <button
              key={type.name}
              className="flex flex-col items-center min-w-[80px] text-gray-600 hover:text-gray-900 focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 group-hover:bg-gray-200 mb-2">
                <span className="text-xl">{type.icon}</span>
              </div>
              <span className="text-xs font-medium">{type.name}</span>
            </button>
          ))}
        </div>
      </div>

      <h2 className="text-xl font-medium mb-6">Chambres disponibles</h2>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Chargement des chambres...</p>
        </div>
      ) : fetchError ? (
        <div className="text-center py-10">
          <p className="text-xl text-red-600 mb-2">Erreur de chargement</p>
          <p className="text-gray-600">{fetchError}</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-gray-600">Aucune chambre trouvée.</p>
          <p className="mt-2 text-gray-500">Essayez de modifier vos critères de recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map((room) => (
            // Vérifier que l'ID est valide avant de créer le lien
            <Link
              href={room.id ? `/room/${encodeURIComponent(room.id)}` : "#"}
              key={room.id}
              className="group flex flex-col h-full rounded-xl overflow-hidden hover:shadow-md transition-all"
              onClick={(e) => {
                if (!room.id) {
                  e.preventDefault()
                  console.error("ID de chambre invalide")
                }
              }}
            >
              {/* Image carousel */}
              <div className="relative overflow-hidden aspect-[4/3] rounded-xl">
                <img
                  src="/hotel.jpg"
                  alt={room.name}
                  className="object-cover w-full h-full transition-transform group-hover:scale-105 duration-300"
                />

                {/* Image navigation buttons */}
                <button
                  onClick={(e) => handleImageNav(e, room.id, "prev")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                <button
                  onClick={(e) => handleImageNav(e, room.id, "next")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>

                {/* Image pagination dots */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`block h-1.5 w-1.5 rounded-full ${currentImageIndexes[room.id] === i ? "bg-white" : "bg-white/50"}`}
                    />
                  ))}
                </div>

                {/* Favorite button */}
                <button onClick={(e) => toggleFavorite(e, room.id)} className="absolute top-3 right-3 z-10">
                  <Heart
                    className={`h-6 w-6 ${favorites.has(room.id) ? "fill-primary text-primary" : "text-white stroke-2"}`}
                  />
                </button>

                {/* Coup de coeur badge */}
                {room.rate >= 4.5 && (
                  <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded-full text-xs font-medium flex items-center shadow-sm">
                    <span className="mr-1">🏆</span>
                    <span>Top noté</span>
                  </div>
                )}
              </div>

              {/* Room details */}
              <div className="flex-grow p-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900 line-clamp-1">{room.name}</h3>
                  <div className="flex items-center text-sm">
                    <Star className="w-4 h-4 fill-current text-black mr-1" />
                    <span>{room.rate}</span>
                  </div>
                </div>

                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{room.content}</p>

                <div className="mt-2 flex flex-wrap gap-1">
                  {room.categories
                    .split(",")
                    .slice(0, 2)
                    .map((category, index) => (
                      <span
                        key={`cat-${index}`}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800"
                      >
                        {category.trim()}
                      </span>
                    ))}
                  {room.tags
                    .split(",")
                    .slice(0, 1)
                    .map((tag, index) => (
                      <span
                        key={`tag-${index}`}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag.trim()}
                      </span>
                    ))}
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100 text-sm">
                  <span className="font-medium">
                    {room.price} € <span className="font-normal text-gray-500">par nuit</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
