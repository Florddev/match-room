"use client"

import LeafletMap from "@/components/leaflet-map"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ArrowUpDown, Bed, Check, ChevronDown, Crown, Droplets, Filter, Heart, Home, List, MapPin, PiggyBank, Search, Star, Tag, Users, X } from "lucide-react"
import Link from "next/link"
import type React from "react"
import { useEffect, useRef, useState } from "react"

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
  hotel?: {
    name: string
    city: string
    zipCode: string
  }
}

type SortOption = {
  label: string
  value: string
  icon?: React.ReactNode
}

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

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const similarityThreshold = 0.5

  // Filtres
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [minRate, setMinRate] = useState<number>(0)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  // Tri
  const [sortBy, setSortBy] = useState<string>("rate-desc")
  const [showSortOptions, setShowSortOptions] = useState<boolean>(false)

  // Affichage carte/liste
  const [showMap, setShowMap] = useState(false)

  // Données filtrées
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([])
  const [uniqueTags, setUniqueTags] = useState<string[]>([])
  const [categorySearchTerm, setCategorySearchTerm] = useState<string>("")
  const [tagSearchTerm, setTagSearchTerm] = useState<string>("")
  const [maxPrice, setMaxPrice] = useState<number>(1000)

  // Catégories sélectionnées pour le filtrage rapide
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([])

  // Refs pour les dropdowns
  const sortRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)
  const tagRef = useRef<HTMLDivElement>(null)

  // Options de tri
  const sortOptions: SortOption[] = [
    { label: "Mieux notés", value: "rate-desc", icon: <Star className="h-4 w-4" /> },
    { label: "Moins bien notés", value: "rate-asc", icon: <Star className="h-4 w-4" /> },
    { label: "Prix croissant", value: "price-asc", icon: <ArrowUpDown className="h-4 w-4" /> },
    { label: "Prix décroissant", value: "price-desc", icon: <ArrowUpDown className="h-4 w-4" /> },
    { label: "Ordre alphabétique", value: "name-asc", icon: <ArrowUpDown className="h-4 w-4" /> },
    { label: "Plus récents", value: "date-desc", icon: <ArrowUpDown className="h-4 w-4" /> },
  ]

  // Types de chambres pour le filtrage rapide
  const roomTypes = [
    { id: "all", name: "Tous", icon: <Home className="h-5 w-5" /> },
    { id: "single", name: "Chambre simple", icon: <Bed className="h-5 w-5" /> },
    { id: "suite", name: "Suite", icon: <Star className="h-5 w-5" /> },
    { id: "family", name: "Familiale", icon: <Users className="h-5 w-5" /> },
    { id: "sea", name: "Vue mer", icon: <Droplets className="h-5 w-5" /> },
    { id: "eco", name: "Économique", icon: <PiggyBank className="h-5 w-5" /> },
    { id: "luxury", name: "Luxe", icon: <Crown className="h-5 w-5" /> },
  ];

  // Fermer les dropdowns lors d'un clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortOptions(false)
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node) && activeFilter !== "category") {
        setActiveFilter(null)
      }
      if (tagRef.current && !tagRef.current.contains(event.target as Node) && activeFilter !== "tag") {
        setActiveFilter(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [activeFilter])

  // Charger les chambres
  useEffect(() => {
    async function fetchRooms() {
      try {
        setIsLoading(true)
        const res = await fetch("/api/rooms", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
        if (!res.ok) throw new Error("Erreur lors du chargement des chambres")
        const data: Room[] = await res.json()
        setRooms(data)
        setFilteredRooms(data)

        const categories = [
          ...new Set(data.flatMap((room) => room.categories.split(",").map((category) => category.trim()))),
        ]
        setUniqueCategories(categories)

        const tags = [...new Set(data.flatMap((room) => room.tags.split(",").map((tag) => tag.trim())))]
        setUniqueTags(tags)

        const highestPrice = Math.max(...data.map((room) => room.price))
        setMaxPrice(Math.ceil(highestPrice / 100) * 100)
        setPriceRange([0, Math.ceil(highestPrice / 100) * 100])

        setIsLoading(false)
      } catch (error) {
        console.error(error)
        setIsLoading(false)
      }
    }
    fetchRooms()
  }, [])

  // Filtrer et trier les chambres
  useEffect(() => {
    let results = rooms

    // Appliquer les filtres
    results = results.filter((room) => {
      const priceInRange = room.price >= priceRange[0] && room.price <= priceRange[1]
      const rateHighEnough = room.rate >= minRate

      // Filtrer par catégories sélectionnées
      const roomCategories = room.categories.split(",").map((c) => c.trim())
      const categoryMatch =
        selectedCategories.length === 0 || selectedCategories.some((cat) => roomCategories.includes(cat))

      // Filtrer par tags sélectionnés
      const roomTags = room.tags.split(",").map((tag) => tag.trim())
      const tagMatch = selectedTags.length === 0 || selectedTags.some((tag) => roomTags.includes(tag))

      // Filtrer par type de chambre (filtrage rapide)
      const roomTypeMatch =
        selectedRoomTypes.length === 0 ||
        selectedRoomTypes.includes("all") ||
        (selectedRoomTypes.includes("single") && roomCategories.some((c) => c.toLowerCase().includes("simple"))) ||
        (selectedRoomTypes.includes("suite") && roomCategories.some((c) => c.toLowerCase().includes("suite"))) ||
        (selectedRoomTypes.includes("family") &&
          roomCategories.some((c) => c.toLowerCase().includes("famille") || c.toLowerCase().includes("familiale"))) ||
        (selectedRoomTypes.includes("sea") &&
          roomCategories.some((c) => c.toLowerCase().includes("mer") || c.toLowerCase().includes("vue mer"))) ||
        (selectedRoomTypes.includes("eco") && room.price < maxPrice / 3) ||
        (selectedRoomTypes.includes("luxury") &&
          (room.rate >= 4.5 || roomCategories.some((c) => c.toLowerCase().includes("luxe"))))

      return (
        priceInRange && rateHighEnough && categoryMatch && tagMatch && (selectedRoomTypes.length === 0 || roomTypeMatch)
      )
    })

    // Recherche textuelle
    const term = searchTerm.trim()
    if (term !== "") {
      const searchWords = term.toLowerCase().split(/\s+/)

      results = results.filter((room) => {
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
            ...room.categories.split(",").flatMap((cat) =>
              cat
                .trim()
                .toLowerCase()
                .split(/\s+/)
                .map((catWord) => calculateSimilarity(word, catWord)),
            ),
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

      // Trier par pertinence pour la recherche
      results = results.sort((a, b) => {
        const aRelevance = calculateOverallRelevance(a, searchWords)
        const bRelevance = calculateOverallRelevance(b, searchWords)
        return bRelevance - aRelevance
      })
    } else {
      // Appliquer le tri sélectionné
      results = sortRooms(results, sortBy)
    }

    setFilteredRooms(results)
  }, [searchTerm, rooms, priceRange, minRate, selectedCategories, selectedTags, sortBy, selectedRoomTypes, maxPrice])

  // Fonction pour trier les chambres
  const sortRooms = (roomsList: Room[], sortOption: string): Room[] => {
    const [field, direction] = sortOption.split("-")

    return [...roomsList].sort((a, b) => {
      let comparison = 0

      switch (field) {
        case "rate":
          comparison = a.rate - b.rate
          break
        case "price":
          comparison = a.price - b.price
          break
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "date":
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        default:
          comparison = 0
      }

      return direction === "asc" ? comparison : -comparison
    })
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
      const categoriesSimilarities = room.categories.split(",").flatMap((cat) =>
        cat
          .trim()
          .toLowerCase()
          .split(/\s+/)
          .map((catWord) => calculateSimilarity(word, catWord)),
      )
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

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const handleTagChange = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const resetFilters = () => {
    setPriceRange([0, maxPrice])
    setMinRate(0)
    setSelectedCategories([])
    setSelectedTags([])
    setSelectedRoomTypes(["all"])
    setSearchTerm("")
    setCategorySearchTerm("")
    setTagSearchTerm("")
  }

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

  const toggleRoomType = (typeId: string) => {
    if (typeId === "all") {
      setSelectedRoomTypes(["all"])
    } else {
      setSelectedRoomTypes((prev) => {
        // Si "all" est sélectionné et qu'on clique sur un autre type, on retire "all"
        if (prev.includes("all")) {
          return [typeId]
        }

        // Si le type est déjà sélectionné, on le retire
        if (prev.includes(typeId)) {
          const newTypes = prev.filter((t) => t !== typeId)
          // Si plus aucun type n'est sélectionné, on remet "all"
          return newTypes.length === 0 ? ["all"] : newTypes
        }

        // Sinon on l'ajoute
        return [...prev, typeId]
      })
    }
  }

  // Initialiser la catégorie "Tous" par défaut
  useEffect(() => {
    if (selectedRoomTypes.length === 0) {
      setSelectedRoomTypes(["all"])
    }
  }, [selectedRoomTypes])

  return (
    <div className="min-h-screen bg-white">
      {/* Barre de recherche et filtres en haut */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Barre de recherche */}
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher une chambre par nom, description, catégorie..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Bouton de tri */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setShowSortOptions(!showSortOptions)}
                  className="w-full md:w-auto flex items-center justify-between gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <ArrowUpDown className="h-5 w-5 text-gray-500" />
                  <span className="hidden md:inline">Trier par</span>
                  <span className="md:hidden">Trier</span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${showSortOptions ? "transform rotate-180" : ""}`}
                  />
                </button>

                {showSortOptions && (
                  <div className="absolute z-20 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="py-1">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value)
                            setShowSortOptions(false)
                          }}
                          className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 ${sortBy === option.value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                            }`}
                        >
                          {option.icon && <span className="mr-2">{option.icon}</span>}
                          {option.label}
                          {sortBy === option.value && <Check className="h-4 w-4 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton de filtres */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="h-5 w-5 text-gray-500" />
                <span>Filtres</span>
                {(minRate > 0 ||
                  selectedCategories.length > 0 ||
                  selectedTags.length > 0 ||
                  priceRange[0] > 0 ||
                  priceRange[1] < maxPrice) && (
                    <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {(minRate > 0 ? 1 : 0) +
                        selectedCategories.length +
                        selectedTags.length +
                        (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0)}
                    </Badge>
                  )}
              </button>
            </div>

            {/* Types de chambres */}
            <div className="flex overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex space-x-4">
                {roomTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => toggleRoomType(type.id)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium focus:outline-none ${selectedRoomTypes.includes(type.id)
                      ? "text-blue-700 bg-blue-50"
                      : "text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    <div className="text-current">
                      {type.icon}
                    </div>
                    <span className="font-medium">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filtres avancés */}
            {showFilters && (
              <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-lg">Filtres avancés</h3>
                  <button onClick={resetFilters} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    Réinitialiser
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Prix */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix: {priceRange[0]} € - {priceRange[1]} €
                    </label>
                    <div className="px-2">
                      <Slider
                        defaultValue={[priceRange[0], priceRange[1]]}
                        min={0}
                        max={maxPrice}
                        step={10}
                        onValueChange={(value) => setPriceRange([value[0], value[1]])}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0 €</span>
                      <span>{maxPrice} €</span>
                    </div>
                  </div>

                  {/* Note minimale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Note minimale: {minRate}</label>
                    <div className="px-2">
                      <Slider
                        defaultValue={[minRate]}
                        min={0}
                        max={5}
                        step={0.5}
                        onValueChange={(value) => setMinRate(value[0])}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>5</span>
                    </div>
                  </div>

                  {/* Catégories */}
                  {uniqueCategories.length > 0 && (
                    <div className="relative" ref={categoryRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catégories{" "}
                        {selectedCategories.length > 0 &&
                          `(${selectedCategories.length} sélectionnée${selectedCategories.length > 1 ? "s" : ""})`}
                      </label>
                      <button
                        className="w-full p-3 border border-gray-300 rounded-lg flex justify-between items-center hover:border-gray-400"
                        onClick={() => setActiveFilter(activeFilter === "category" ? null : "category")}
                      >
                        <div className="truncate">
                          {selectedCategories.length === 0
                            ? "Sélectionner une catégorie"
                            : selectedCategories.length === 1
                              ? selectedCategories[0]
                              : `${selectedCategories.length} catégories sélectionnées`}
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${activeFilter === "category" ? "transform rotate-180" : ""}`}
                        />
                      </button>

                      {activeFilter === "category" && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                          <div className="sticky top-0 bg-white p-2 border-b">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Rechercher une catégorie..."
                                className="w-full pl-8 pr-2 py-2 border rounded-lg text-sm"
                                value={categorySearchTerm}
                                onChange={(e) => setCategorySearchTerm(e.target.value)}
                              />
                            </div>
                          </div>
                          <div>
                            {uniqueCategories
                              .filter((category) => category.toLowerCase().includes(categorySearchTerm.toLowerCase()))
                              .map((category) => (
                                <div
                                  key={category}
                                  className={`p-3 hover:bg-gray-100 cursor-pointer ${selectedCategories.includes(category) ? "bg-blue-50" : ""
                                    }`}
                                  onClick={() => handleCategoryChange(category)}
                                >
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedCategories.includes(category)}
                                      onChange={() => { }}
                                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>{category}</span>
                                  </div>
                                </div>
                              ))}
                            {uniqueCategories.filter((category) =>
                              category.toLowerCase().includes(categorySearchTerm.toLowerCase()),
                            ).length === 0 && (
                                <div className="p-3 text-gray-500 text-center">Aucune catégorie trouvée</div>
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {uniqueTags.length > 0 && (
                    <div className="relative" ref={tagRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags{" "}
                        {selectedTags.length > 0 &&
                          `(${selectedTags.length} sélectionné${selectedTags.length > 1 ? "s" : ""})`}
                      </label>
                      <button
                        className="w-full p-3 border border-gray-300 rounded-lg flex justify-between items-center hover:border-gray-400"
                        onClick={() => setActiveFilter(activeFilter === "tag" ? null : "tag")}
                      >
                        <div className="truncate">
                          {selectedTags.length === 0
                            ? "Sélectionner un tag"
                            : selectedTags.length === 1
                              ? selectedTags[0]
                              : `${selectedTags.length} tags sélectionnés`}
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${activeFilter === "tag" ? "transform rotate-180" : ""}`}
                        />
                      </button>

                      {activeFilter === "tag" && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                          <div className="sticky top-0 bg-white p-2 border-b">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Rechercher un tag..."
                                className="w-full pl-8 pr-2 py-2 border rounded-lg text-sm"
                                value={tagSearchTerm}
                                onChange={(e) => setTagSearchTerm(e.target.value)}
                              />
                            </div>
                          </div>
                          <div>
                            {uniqueTags
                              .filter((tag) => tag.toLowerCase().includes(tagSearchTerm.toLowerCase()))
                              .map((tag) => (
                                <div
                                  key={tag}
                                  className={`p-3 hover:bg-gray-100 cursor-pointer ${selectedTags.includes(tag) ? "bg-blue-50" : ""
                                    }`}
                                  onClick={() => handleTagChange(tag)}
                                >
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedTags.includes(tag)}
                                      onChange={() => { }}
                                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>{tag}</span>
                                  </div>
                                </div>
                              ))}
                            {uniqueTags.filter((tag) => tag.toLowerCase().includes(tagSearchTerm.toLowerCase()))
                              .length === 0 && <div className="p-3 text-gray-500 text-center">Aucun tag trouvé</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Filtres actifs */}
                {(minRate > 0 ||
                  selectedCategories.length > 0 ||
                  selectedTags.length > 0 ||
                  priceRange[0] > 0 ||
                  priceRange[1] < maxPrice) && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      <div className="text-sm text-gray-700 mr-2 pt-1">Filtres actifs:</div>

                      {minRate > 0 && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200"
                        >
                          Note ≥ {minRate}
                          <button onClick={() => setMinRate(0)} className="ml-1 hover:bg-blue-100 rounded-full p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}

                      {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200"
                        >
                          Prix: {priceRange[0]}€ - {priceRange[1]}€
                          <button
                            onClick={() => setPriceRange([0, maxPrice])}
                            className="ml-1 hover:bg-blue-100 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}

                      {selectedCategories.map((category) => (
                        <Badge
                          key={category}
                          variant="outline"
                          className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {category}
                          <button
                            onClick={() => handleCategoryChange(category)}
                            className="ml-1 hover:bg-blue-100 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}

                      {selectedTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {tag}
                          <button
                            onClick={() => handleTagChange(tag)}
                            className="ml-1 hover:bg-blue-100 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        Effacer tout
                      </Button>
                    </div>
                  )}
              </div>
            )}

            <div className="text-sm text-gray-500 flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              {filteredRooms.length} chambre{filteredRooms.length !== 1 ? "s" : ""} trouvée
              {filteredRooms.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal - Carte et liste */}
      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-xl text-gray-600">Chargement des chambres...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl shadow-sm p-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bed className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-xl font-medium text-gray-900 mb-2">Aucune chambre ne correspond à vos critères</p>
            <p className="text-gray-500 max-w-md mx-auto">
              Essayez de modifier vos filtres ou d'élargir votre recherche pour trouver des chambres qui correspondent à
              vos besoins.
            </p>
            <Button variant="outline" onClick={resetFilters} className="mt-4">
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Liste des chambres - Visible uniquement si showMap est false */}
            <div className={`${showMap ? "hidden md:block" : "block"} md:w-3/5 lg:w-2/3`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms.map((room) => (
                  <Link
                    href={`/room/${room.id}`}
                    key={room.id}
                    className="group flex flex-col h-full bg-white rounded-xl overflow-hidden hover:shadow-md transition-all border border-gray-200"
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden aspect-[4/3]">
                      <img
                        src="/hotel.jpg"
                        alt={room.name}
                        className="object-cover w-full h-full transition-transform group-hover:scale-105 duration-300"
                      />

                      {/* Favorite button */}
                      <button onClick={(e) => toggleFavorite(e, room.id)} className="absolute top-3 right-3 z-10">
                        <Heart
                          className={`h-6 w-6 ${favorites.has(room.id) ? "fill-red-500 text-red-500" : "text-white stroke-2 drop-shadow-md"
                            }`}
                        />
                      </button>

                      {/* Rating badge for top rooms */}
                      {room.rate >= 4.5 && (
                        <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded-full text-xs font-medium flex items-center shadow-sm">
                          <span className="mr-1">🏆</span>
                          <span>Top noté</span>
                        </div>
                      )}

                      {/* Price badge */}
                      <div className="absolute bottom-3 left-3 bg-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                        {room.price} € <span className="text-xs font-normal">/ nuit</span>
                      </div>
                    </div>

                    {/* Room details */}
                    <div className="flex-grow p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-900 line-clamp-1">{room.name}</h3>
                        <div className="flex items-center text-sm bg-gray-100 px-2 py-0.5 rounded-md">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="font-medium">{room.rate.toFixed(1)}</span>
                        </div>
                      </div>

                      {room.hotel && (
                        <div className="mt-2 text-gray-500 text-sm flex items-start">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5 mr-1" />
                          <span className="line-clamp-1">
                            {room.hotel.name}, {room.hotel.zipCode} {room.hotel.city}
                          </span>
                        </div>
                      )}

                      <p className="mt-2 text-gray-500 text-sm line-clamp-2">{room.content}</p>

                      <div className="mt-3 flex flex-wrap gap-1">
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
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag.trim()}
                            </span>
                          ))}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Mis à jour le {new Date(room.updatedAt).toLocaleDateString()}
                        </span>
                        <span className="text-blue-600 text-sm font-medium group-hover:underline">Voir détails →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Carte - Visible uniquement si showMap est true */}
            <div className={`${!showMap ? "hidden md:block" : "block"} md:w-2/5 lg:w-1/3 h-[calc(100vh-200px)] sticky top-[100px]`}>
              <div className="h-full rounded-xl overflow-hidden border border-gray-200 shadow-md">
                <LeafletMap filteredRooms={filteredRooms as any} />
              </div>

              {/* Bouton pour afficher la liste sur mobile quand la carte est visible */}
              <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-10">
                <button
                  onClick={() => setShowMap(false)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg"
                >
                  <List size={20} />
                  <span>Voir {filteredRooms.length} résultats</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bouton flottant pour basculer vers la carte sur mobile quand la liste est visible */}
      {!showMap && (
        <div className="md:hidden fixed bottom-6 right-6 z-10">
          <button
            onClick={() => setShowMap(true)}
            className="flex items-center justify-center bg-white p-3 rounded-full shadow-lg border border-gray-200"
          >
            <MapPin size={24} className="text-blue-600" />
          </button>
        </div>
      )}
    </div>
  )
}
