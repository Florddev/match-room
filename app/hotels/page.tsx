"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { ArrowUpDown, Building2, Check, ChevronDown, Filter, Heart, MapPin, Phone, Search, Star, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"

type Hotel = {
  id: string
  name: string
  rate: number
  address: string
  city: string
  zipCode: string
  phone: string
  createdAt: string
  updatedAt: string
  rooms: any[]
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

export default function HotelsList() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([])
  const similarityThreshold = 0.5

  // Filtres
  const [minRate, setMinRate] = useState<number>(0)
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>([])
  const [minRooms, setMinRooms] = useState<number>(0)
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  // Tri
  const [sortBy, setSortBy] = useState<string>("rate-desc")
  const [showSortOptions, setShowSortOptions] = useState<boolean>(false)

  // Données filtrées
  const [uniqueCities, setUniqueCities] = useState<string[]>([])
  const [uniqueZipCodes, setUniqueZipCodes] = useState<string[]>([])
  const [citySearchTerm, setCitySearchTerm] = useState<string>("")
  const [zipSearchTerm, setZipSearchTerm] = useState<string>("")

  // Catégories sélectionnées
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Refs pour les dropdowns
  const sortRef = useRef<HTMLDivElement>(null)
  const cityRef = useRef<HTMLDivElement>(null)
  const zipRef = useRef<HTMLDivElement>(null)

  // Options de tri
  const sortOptions: SortOption[] = [
    { label: "Mieux notés", value: "rate-desc", icon: <Star className="h-4 w-4" /> },
    { label: "Moins bien notés", value: "rate-asc", icon: <Star className="h-4 w-4" /> },
    { label: "Plus de chambres", value: "rooms-desc", icon: <Building2 className="h-4 w-4" /> },
    { label: "Moins de chambres", value: "rooms-asc", icon: <Building2 className="h-4 w-4" /> },
    { label: "Ordre alphabétique", value: "name-asc", icon: <ArrowUpDown className="h-4 w-4" /> },
    { label: "Plus récents", value: "date-desc", icon: <ArrowUpDown className="h-4 w-4" /> },
  ]

  // Catégories pour le filtrage rapide
  const categories = [
    { id: "all", name: "Tous", icon: "🏠" },
    { id: "luxury", name: "Luxe", icon: "✨" },
    { id: "downtown", name: "Centre-ville", icon: "🏙️" },
    { id: "seaside", name: "Bord de mer", icon: "🌊" },
    { id: "mountain", name: "Montagne", icon: "⛰️" },
    { id: "countryside", name: "Campagne", icon: "🌳" },
    { id: "business", name: "Affaires", icon: "💼" },
  ]

  // Fermer les dropdowns lors d'un clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortOptions(false)
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node) && activeFilter !== "city") {
        setActiveFilter(null)
      }
      if (zipRef.current && !zipRef.current.contains(event.target as Node) && activeFilter !== "zip") {
        setActiveFilter(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [activeFilter])

  // Charger les hôtels
  useEffect(() => {
    async function fetchHotels() {
      try {
        setIsLoading(true)
        const res = await fetch("/api/hotels", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
        if (!res.ok) throw new Error("Erreur lors du chargement des hôtels")
        const data: Hotel[] = await res.json()
        setHotels(data)
        setFilteredHotels(data)

        const cities = [...new Set(data.map((hotel) => hotel.city))]
        setUniqueCities(cities)

        const zipCodes = [...new Set(data.map((hotel) => hotel.zipCode))]
        setUniqueZipCodes(zipCodes)

        setIsLoading(false)
      } catch (error) {
        console.error(error)
        setIsLoading(false)
      }
    }
    fetchHotels()
  }, [])

  // Filtrer et trier les hôtels
  useEffect(() => {
    let results = hotels

    // Appliquer les filtres
    results = results.filter((hotel) => {
      const rateHighEnough = hotel.rate >= minRate
      const roomsEnough = (hotel.rooms?.length || 0) >= minRooms
      const cityMatch = selectedCities.length === 0 || selectedCities.includes(hotel.city)
      const zipCodeMatch = selectedZipCodes.length === 0 || selectedZipCodes.includes(hotel.zipCode)

      // Filtrer par catégorie
      const categoryMatch =
        selectedCategories.length === 0 ||
        (selectedCategories.includes("luxury") && hotel.rate >= 4.5) ||
        (selectedCategories.includes("downtown") && hotel.address.toLowerCase().includes("centre")) ||
        (selectedCategories.includes("seaside") &&
          (hotel.address.toLowerCase().includes("mer") ||
            hotel.address.toLowerCase().includes("plage") ||
            hotel.address.toLowerCase().includes("ocean"))) ||
        (selectedCategories.includes("mountain") &&
          (hotel.address.toLowerCase().includes("montagne") ||
            hotel.address.toLowerCase().includes("alpes") ||
            hotel.address.toLowerCase().includes("pyrénées"))) ||
        (selectedCategories.includes("countryside") &&
          (hotel.address.toLowerCase().includes("campagne") || hotel.address.toLowerCase().includes("rural"))) ||
        (selectedCategories.includes("business") &&
          (hotel.address.toLowerCase().includes("business") || hotel.address.toLowerCase().includes("affaires")))

      return (
        rateHighEnough &&
        cityMatch &&
        zipCodeMatch &&
        roomsEnough &&
        (selectedCategories.includes("all") || categoryMatch)
      )
    })

    // Recherche textuelle
    const term = searchTerm.trim()
    if (term !== "") {
      const searchWords = term.toLowerCase().split(/\s+/)

      results = results.filter((hotel) => {
        return searchWords.some((word) => {
          const nameSimilarity = Math.max(
            ...hotel.name
              .toLowerCase()
              .split(/\s+/)
              .map((nameWord) => calculateSimilarity(word, nameWord)),
            0,
          )

          const addressSimilarity = Math.max(
            ...hotel.address
              .toLowerCase()
              .split(/\s+/)
              .map((addrWord) => calculateSimilarity(word, addrWord)),
            0,
          )

          const citySimilarity = Math.max(
            ...hotel.city
              .toLowerCase()
              .split(/\s+/)
              .map((cityWord) => calculateSimilarity(word, cityWord)),
            0,
          )

          const zipCodeSimilarity = calculateSimilarity(word, hotel.zipCode)
          const phoneSimilarity = calculateSimilarity(word, hotel.phone)

          return (
            nameSimilarity >= similarityThreshold ||
            addressSimilarity >= similarityThreshold ||
            citySimilarity >= similarityThreshold ||
            zipCodeSimilarity >= similarityThreshold ||
            phoneSimilarity >= similarityThreshold
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
      results = sortHotels(results, sortBy)
    }

    setFilteredHotels(results)
  }, [searchTerm, hotels, minRate, selectedCities, selectedZipCodes, minRooms, sortBy, selectedCategories])

  // Fonction pour trier les hôtels
  const sortHotels = (hotelsList: Hotel[], sortOption: string): Hotel[] => {
    const [field, direction] = sortOption.split("-")

    return [...hotelsList].sort((a, b) => {
      let comparison = 0

      switch (field) {
        case "rate":
          comparison = a.rate - b.rate
          break
        case "rooms":
          comparison = (a.rooms?.length || 0) - (b.rooms?.length || 0)
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

  function calculateOverallRelevance(hotel: Hotel, searchWords: string[]): number {
    let totalRelevance = 0

    searchWords.forEach((word) => {
      const nameSimilarities = hotel.name
        .toLowerCase()
        .split(/\s+/)
        .map((nameWord) => calculateSimilarity(word, nameWord))
        
      const addressSimilarities = hotel.address
        .toLowerCase()
        .split(/\s+/)
        .map((addrWord) => calculateSimilarity(word, addrWord))

      const citySimilarities = hotel.city
        .toLowerCase()
        .split(/\s+/)
        .map((cityWord) => calculateSimilarity(word, cityWord))

      const zipCodeSimilarity = calculateSimilarity(word, hotel.zipCode)
      const phoneSimilarity = calculateSimilarity(word, hotel.phone)

      totalRelevance += Math.max(...nameSimilarities, 0) * 3
      totalRelevance += Math.max(...addressSimilarities, 0) * 2
      totalRelevance += Math.max(...citySimilarities, 0) * 2
      totalRelevance += zipCodeSimilarity * 1.5
      totalRelevance += phoneSimilarity
    })

    return totalRelevance
  }

  const handleCityChange = (city: string) => {
    setSelectedCities((prev) => (prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]))
  }

  const handleZipCodeChange = (zipCode: string) => {
    setSelectedZipCodes((prev) => (prev.includes(zipCode) ? prev.filter((z) => z !== zipCode) : [...prev, zipCode]))
  }

  const resetFilters = () => {
    setMinRate(0)
    setSelectedCities([])
    setSelectedZipCodes([])
    setMinRooms(0)
    setSearchTerm("")
    setCitySearchTerm("")
    setZipSearchTerm("")
    setSelectedCategories(["all"])
  }

  const toggleFavorite = (e: React.MouseEvent, hotelId: string) => {
    e.preventDefault()
    e.stopPropagation()

    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(hotelId)) {
        newFavorites.delete(hotelId)
      } else {
        newFavorites.add(hotelId)
      }
      return newFavorites
    })
  }

  const toggleCategory = (categoryId: string) => {
    if (categoryId === "all") {
      setSelectedCategories(["all"])
    } else {
      setSelectedCategories((prev) => {
        // Si "all" est sélectionné et qu'on clique sur une autre catégorie, on retire "all"
        if (prev.includes("all")) {
          return [categoryId]
        }

        // Si la catégorie est déjà sélectionnée, on la retire
        if (prev.includes(categoryId)) {
          const newCategories = prev.filter((c) => c !== categoryId)
          // Si plus aucune catégorie n'est sélectionnée, on remet "all"
          return newCategories.length === 0 ? ["all"] : newCategories
        }

        // Sinon on l'ajoute
        return [...prev, categoryId]
      })
    }
  }

  // Initialiser la catégorie "Tous" par défaut
  useEffect(() => {
    if (selectedCategories.length === 0) {
      setSelectedCategories(["all"])
    }
  }, [selectedCategories])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête avec titre et compteur */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">Découvrez nos hôtels</h1>
        <div className="text-sm text-gray-500 flex items-center">
          <Building2 className="h-4 w-4 mr-1" />
          {filteredHotels.length} hôtel{filteredHotels.length !== 1 ? "s" : ""} disponible
          {filteredHotels.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          {/* Barre de recherche */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un hôtel par nom, adresse, ville..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-0 pr-3 flex items-center">
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
                      className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 ${
                        sortBy === option.value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
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
            {(minRate > 0 || selectedCities.length > 0 || selectedZipCodes.length > 0 || minRooms > 0) && (
              <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
                {minRate > 0 + selectedCities.length + selectedZipCodes.length + (minRooms > 0 ? 1 : 0)}
              </Badge>
            )}
          </button>
        </div>

        {/* Catégories */}
        <div className="flex overflow-x-auto pb-4 mb-4 scrollbar-hide">
          <div className="flex space-x-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`flex flex-col items-center min-w-[80px] focus:outline-none group ${
                  selectedCategories.includes(category.id) ? "text-blue-700" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    selectedCategories.includes(category.id)
                      ? "bg-blue-100 ring-2 ring-blue-500"
                      : "bg-gray-100 group-hover:bg-gray-200"
                  }`}
                >
                  <span className="text-xl">{category.icon}</span>
                </div>
                <span className="text-xs font-medium">{category.name}</span>
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
              {/* Note minimale */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note minimale: {minRate}</label>
                <Slider
                  defaultValue={[minRate]}
                  max={5}
                  step={0.5}
                  onValueChange={(value) => setMinRate(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>5</span>
                </div>
              </div>

              {/* Nombre minimum de chambres */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre minimum de chambres: {minRooms}
                </label>
                <Slider
                  defaultValue={[minRooms]}
                  max={20}
                  step={1}
                  onValueChange={(value) => setMinRooms(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>20+</span>
                </div>
              </div>

              {/* Villes */}
              {uniqueCities.length > 0 && (
                <div className="relative" ref={cityRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Villes{" "}
                    {selectedCities.length > 0 &&
                      `(${selectedCities.length} sélectionnée${selectedCities.length > 1 ? "s" : ""})`}
                  </label>
                  <button
                    className="w-full p-3 border border-gray-300 rounded-lg flex justify-between items-center hover:border-gray-400"
                    onClick={() => setActiveFilter(activeFilter === "city" ? null : "city")}
                  >
                    <div className="truncate">
                      {selectedCities.length === 0
                        ? "Sélectionner une ville"
                        : selectedCities.length === 1
                          ? selectedCities[0]
                          : `${selectedCities.length} villes sélectionnées`}
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${activeFilter === "city" ? "transform rotate-180" : ""}`}
                    />
                  </button>

                  {activeFilter === "city" && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                      <div className="sticky top-0 bg-white p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Rechercher une ville..."
                            className="w-full pl-8 pr-2 py-2 border rounded-lg text-sm"
                            value={citySearchTerm}
                            onChange={(e) => setCitySearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        {uniqueCities
                          .filter((city) => city.toLowerCase().includes(citySearchTerm.toLowerCase()))
                          .map((city) => (
                            <div
                              key={city}
                              className={`p-3 hover:bg-gray-100 cursor-pointer ${
                                selectedCities.includes(city) ? "bg-blue-50" : ""
                              }`}
                              onClick={() => handleCityChange(city)}
                            >
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedCities.includes(city)}
                                  onChange={() => {}}
                                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span>{city}</span>
                              </div>
                            </div>
                          ))}
                        {uniqueCities.filter((city) => city.toLowerCase().includes(citySearchTerm.toLowerCase()))
                          .length === 0 && <div className="p-3 text-gray-500 text-center">Aucune ville trouvée</div>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Codes postaux */}
              {uniqueZipCodes.length > 0 && (
                <div className="relative" ref={zipRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Codes postaux{" "}
                    {selectedZipCodes.length > 0 &&
                      `(${selectedZipCodes.length} sélectionné${selectedZipCodes.length > 1 ? "s" : ""})`}
                  </label>
                  <button
                    className="w-full p-3 border border-gray-300 rounded-lg flex justify-between items-center hover:border-gray-400"
                    onClick={() => setActiveFilter(activeFilter === "zip" ? null : "zip")}
                  >
                    <div className="truncate">
                      {selectedZipCodes.length === 0
                        ? "Sélectionner un code postal"
                        : selectedZipCodes.length === 1
                          ? selectedZipCodes[0]
                          : `${selectedZipCodes.length} codes postaux sélectionnés`}
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${activeFilter === "zip" ? "transform rotate-180" : ""}`}
                    />
                  </button>

                  {activeFilter === "zip" && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                      <div className="sticky top-0 bg-white p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Rechercher un code postal..."
                            className="w-full pl-8 pr-2 py-2 border rounded-lg text-sm"
                            value={zipSearchTerm}
                            onChange={(e) => setZipSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        {uniqueZipCodes
                          .filter((zipCode) => zipCode.toLowerCase().includes(zipSearchTerm.toLowerCase()))
                          .map((zipCode) => (
                            <div
                              key={zipCode}
                              className={`p-3 hover:bg-gray-100 cursor-pointer ${
                                selectedZipCodes.includes(zipCode) ? "bg-blue-50" : ""
                              }`}
                              onClick={() => handleZipCodeChange(zipCode)}
                            >
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedZipCodes.includes(zipCode)}
                                  onChange={() => {}}
                                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span>{zipCode}</span>
                              </div>
                            </div>
                          ))}
                        {uniqueZipCodes.filter((zipCode) => zipCode.toLowerCase().includes(zipSearchTerm.toLowerCase()))
                          .length === 0 && (
                          <div className="p-3 text-gray-500 text-center">Aucun code postal trouvé</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filtres actifs */}
            {(minRate > 0 || selectedCities.length > 0 || selectedZipCodes.length > 0 || minRooms > 0) && (
              <div className="mt-6 flex flex-wrap gap-2">
                <div className="text-sm text-gray-700 mr-2 pt-1">Filtres actifs:</div>

                {minRate > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
                    Note ≥ {minRate}
                    <button onClick={() => setMinRate(0)} className="ml-1 hover:bg-blue-100 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {minRooms > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
                    Chambres ≥ {minRooms}
                    <button onClick={() => setMinRooms(0)} className="ml-1 hover:bg-blue-100 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {selectedCities.map((city) => (
                  <Badge
                    key={city}
                    variant="outline"
                    className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {city}
                    <button
                      onClick={() => handleCityChange(city)}
                      className="ml-1 hover:bg-blue-100 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}

                {selectedZipCodes.map((zip) => (
                  <Badge
                    key={zip}
                    variant="outline"
                    className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {zip}
                    <button
                      onClick={() => handleZipCodeChange(zip)}
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
          <Filter className="h-4 w-4 mr-1" />
          {filteredHotels.length} résultat{filteredHotels.length !== 1 ? "s" : ""} trouvé
          {filteredHotels.length !== 1 ? "s" : ""}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Chargement des hôtels...</p>
        </div>
      ) : filteredHotels.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl shadow-sm p-8">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-xl font-medium text-gray-900 mb-2">Aucun hôtel ne correspond à vos critères</p>
          <p className="text-gray-500 max-w-md mx-auto">
            Essayez de modifier vos filtres ou d'élargir votre recherche pour trouver des hôtels qui correspondent à vos
            besoins.
          </p>
          <Button variant="outline" onClick={resetFilters} className="mt-4">
            Réinitialiser les filtres
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredHotels.map((hotel) => (
            <Link
              href={`/dashboard/hotels/${hotel.id}`}
              key={hotel.id}
              className="group flex flex-col h-full bg-white rounded-xl overflow-hidden hover:shadow-md transition-all border border-gray-200"
            >
              {/* Image */}
              <div className="relative overflow-hidden aspect-[4/3]">
                <img
                  src="/hotel.jpg"
                  alt={hotel.name}
                  className="object-cover w-full h-full transition-transform group-hover:scale-105 duration-300"
                />

                {/* Favorite button */}
                <button onClick={(e) => toggleFavorite(e, hotel.id)} className="absolute top-3 right-3 z-10">
                  <Heart
                    className={`h-6 w-6 ${
                      favorites.has(hotel.id) ? "fill-red-500 text-red-500" : "text-white stroke-2 drop-shadow-md"
                    }`}
                  />
                </button>

                {/* Rating badge for top hotels */}
                {hotel.rate >= 4.5 && (
                  <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded-full text-xs font-medium flex items-center shadow-sm">
                    <span className="mr-1">🏆</span>
                    <span>Top noté</span>
                  </div>
                )}
              </div>

              {/* Hotel details */}
              <div className="flex-grow p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900 line-clamp-1">{hotel.name}</h3>
                  <div className="flex items-center text-sm bg-gray-100 px-2 py-0.5 rounded-md">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-medium">{hotel.rate.toFixed(1)}</span>
                  </div>
                </div>

                <div className="mt-2 text-gray-500 text-sm flex items-start">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 mr-1" />
                  <span className="line-clamp-1">
                    {hotel.address}, {hotel.zipCode} {hotel.city}
                  </span>
                </div>

                <div className="mt-2 text-gray-500 text-sm flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  <span>{hotel.phone}</span>
                </div>

                <div className="mt-3 text-sm">
                  <span className="font-medium text-blue-700">
                    {hotel.rooms?.length || 0} chambre{hotel.rooms?.length !== 1 ? "s" : ""} disponible
                    {hotel.rooms?.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
                  <span>Mis à jour le {new Date(hotel.updatedAt).toLocaleDateString()}</span>
                  <span className="text-blue-600 font-medium group-hover:underline">Voir détails →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
