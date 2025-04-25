"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  Briefcase,
  Building,
  Calendar,
  Car,
  Check,
  Coffee,
  DollarSign,
  Dumbbell,
  MapPin,
  Maximize2,
  MessageCircle,
  Minimize2,
  Mountain,
  Palmtree,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Sunset,
  Users,
  Utensils,
  Waves,
  Wifi,
  X,
  Search,
  Filter,
  Bed,
} from "lucide-react"
import Image from "next/image"
import type React from "react"
import { useRouter } from "next/navigation"

// Types
type ChatMessageType =
  | "text"
  | "options"
  | "date"
  | "profile"
  | "properties"
  | "budget"
  | "property"
  | "loading"
  | "search"

type MessageSender = "system" | "user"

interface ChatOption {
  id: string
  text: string
  icon?: string
}

interface DateRange {
  start: string
  end: string
}

interface HostInfo {
  name: string
  image: string
  responseRate: number
  superHost: boolean
}

interface Property {
  id: number | string
  name: string
  location: string
  region?: string
  description: string
  originalPrice?: number
  discountedPrice?: number
  price?: number
  rate: number
  image: string
  tags: string[]
  amenities?: string[]
  style?: string
  compatibility?: number
  reviews?: number
  host?: HostInfo
  city?: string
  zipCode?: string
  hotelId?: string
  categories?: string
}

interface UserProfile {
  destination: string
  dates: DateRange
  style: string
  essentials: string[]
  budget: number[]
  extras: string[]
}

interface ChatMessage {
  id: number
  type: ChatMessageType
  sender: MessageSender
  content: string
  options?: ChatOption[]
  properties?: Property[]
  dateRange?: DateRange
  budget?: number[]
  profile?: UserProfile
  multiSelect?: boolean
  searchQuery?: string
}

interface ChatStep {
  id: number
  message: string
  type: ChatMessageType
  options?: ChatOption[]
  multiSelect?: boolean
}

interface HotelChatbotProps {
  botName?: string
  botAvatar?: string
  userAvatar?: string
  accentColor?: string
  position?: "bottom-right" | "bottom-left" | "bottom-center"
  initialMessage?: string
  properties?: Property[]
  onSearch?: (query: string) => void
  onFilterChange?: (filters: any) => void
  pageType?: "home" | "hotels" | "rooms"
}

const HotelChatbot: React.FC<HotelChatbotProps> = ({
  botName = "Match Room Assistant",
  botAvatar = "/placeholder.svg?key=o7ntv",
  userAvatar = "/placeholder.svg?key=4txfd",
  accentColor = "#6366f1",
  position = "bottom-right",
  initialMessage = "Bonjour ! Comment puis-je vous aider à trouver votre logement idéal ?",
  properties = [],
  onSearch,
  onFilterChange,
  pageType = "home",
}) => {
  const router = useRouter()
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMinimized, setChatMinimized] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [currentStep, setCurrentStep] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    destination: "",
    dates: { start: "", end: "" },
    style: "",
    essentials: [],
    budget: [100, 300],
    extras: [],
  })
  const [selectedProperties, setSelectedProperties] = useState<Set<string | number>>(new Set())
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const [allHotels, setAllHotels] = useState<any[]>([])
  const [allRooms, setAllRooms] = useState<any[]>([])
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // Charger les données des hôtels et des chambres
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les hôtels
        const hotelsRes = await fetch("/api/hotels", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (hotelsRes.ok) {
          const hotelsData = await hotelsRes.json()
          setAllHotels(hotelsData)

          // Transformer les hôtels en propriétés pour le chatbot
          const hotelProperties: Property[] = hotelsData.map((hotel: any) => ({
            id: hotel.id,
            name: hotel.name,
            location: `${hotel.address}, ${hotel.zipCode} ${hotel.city}`,
            description: `Hôtel situé à ${hotel.city}`,
            price: 0, // Prix moyen des chambres sera calculé plus tard
            rate: hotel.rate,
            image: "/hotel.jpg",
            tags: ["Hôtel"],
            city: hotel.city,
            zipCode: hotel.zipCode,
          }))

          // Charger les chambres
          const roomsRes = await fetch("/api/rooms", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (roomsRes.ok) {
            const roomsData = await roomsRes.json()
            setAllRooms(roomsData)

            // Transformer les chambres en propriétés pour le chatbot
            const roomProperties: Property[] = roomsData.map((room: any) => ({
              id: room.id,
              name: room.name,
              location: room.hotelId ? `Hôtel ID: ${room.hotelId}` : "Emplacement non spécifié",
              description: room.content,
              price: room.price,
              rate: room.rate,
              image: "/hotel.jpg",
              tags: room.tags.split(",").map((tag: string) => tag.trim()),
              hotelId: room.hotelId,
              categories: room.categories,
            }))

            // Combiner les propriétés
            const combinedProperties = [...hotelProperties, ...roomProperties]
            setAllProperties(combinedProperties)
            setIsDataLoaded(true)
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
      }
    }

    fetchData()
  }, [])

  // Initialiser le chat avec un message de bienvenue
  useEffect(() => {
    if (chatMessages.length === 0) {
      let welcomeMessage = initialMessage

      // Personnaliser le message en fonction de la page
      if (pageType === "hotels") {
        welcomeMessage = "Bonjour ! Je peux vous aider à trouver l'hôtel parfait. Que recherchez-vous ?"
      } else if (pageType === "rooms") {
        welcomeMessage = "Bonjour ! Je peux vous aider à trouver la chambre idéale. Quels sont vos critères ?"
      }

      setChatMessages([
        {
          id: 1,
          type: "text",
          sender: "system",
          content: welcomeMessage,
        },
        {
          id: 2,
          type: "options",
          sender: "system",
          content: "",
          options: getInitialOptions(),
        },
      ])
    }
  }, [chatMessages.length, initialMessage, pageType])

  // Obtenir les options initiales en fonction de la page
  const getInitialOptions = useCallback(() => {
    if (pageType === "hotels") {
      return [
        { id: "search-hotel", text: "Rechercher un hôtel", icon: "Search" },
        { id: "filter-location", text: "Filtrer par lieu", icon: "MapPin" },
        { id: "filter-rating", text: "Filtrer par note", icon: "Star" },
        { id: "recommendations", text: "Recommandations", icon: "Sparkles" },
      ]
    } else if (pageType === "rooms") {
      return [
        { id: "search-room", text: "Rechercher une chambre", icon: "Search" },
        { id: "filter-price", text: "Filtrer par prix", icon: "DollarSign" },
        { id: "filter-amenities", text: "Filtrer par équipements", icon: "Wifi" },
        { id: "recommendations", text: "Recommandations", icon: "Sparkles" },
      ]
    } else {
      return [
        { id: "destination", text: "Rechercher par destination", icon: "MapPin" },
        { id: "dates", text: "Sélectionner des dates", icon: "Calendar" },
        { id: "budget", text: "Définir un budget", icon: "DollarSign" },
        { id: "recommendations", text: "Recommandations", icon: "Sparkles" },
      ]
    }
  }, [pageType])

  // Faire défiler vers le bas du chat lorsque de nouveaux messages sont ajoutés
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  // Simuler la saisie de l'IA
  const simulateTyping = useCallback((callback: () => void) => {
    setIsTyping(true)
    const typingTime = Math.random() * 1000 + 500 // Entre 500ms et 1500ms
    setTimeout(() => {
      setIsTyping(false)
      callback()
    }, typingTime)
  }, [])

  // Gérer la sélection d'une option
  const handleOptionSelect = useCallback(
    (optionId: string, optionText: string, multiSelect = false) => {
      // Ajouter la réponse de l'utilisateur
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "text",
          sender: "user",
          content: optionText,
        },
      ])

      // Traiter l'option sélectionnée
      if (optionId === "search-hotel" || optionId === "search-room") {
        simulateTyping(() => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "text",
              sender: "system",
              content: `Que souhaitez-vous rechercher ?`,
            },
            {
              id: Date.now() + 1,
              type: "search",
              sender: "system",
              content: "",
              searchQuery: "",
            },
          ])
        })
        return
      } else if (optionId === "filter-location") {
        simulateTyping(() => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "text",
              sender: "system",
              content: "Dans quelle ville souhaitez-vous séjourner ?",
            },
          ])
        })
        return
      } else if (optionId === "filter-rating") {
        simulateTyping(() => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "text",
              sender: "system",
              content: "Quelle note minimale recherchez-vous ?",
            },
            {
              id: Date.now() + 1,
              type: "options",
              sender: "system",
              content: "",
              options: [
                { id: "rating-3", text: "3 étoiles et plus", icon: "Star" },
                { id: "rating-4", text: "4 étoiles et plus", icon: "Star" },
                { id: "rating-4.5", text: "4.5 étoiles et plus", icon: "Star" },
              ],
            },
          ])
        })
        return
      } else if (optionId.startsWith("rating-")) {
        const rating = Number.parseFloat(optionId.replace("rating-", ""))

        // Filtrer les propriétés par note
        const filteredProperties = allProperties.filter((property) => property.rate >= rating)

        simulateTyping(() => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "text",
              sender: "system",
              content: `Voici les logements avec une note de ${rating} ou plus :`,
            },
            {
              id: Date.now() + 1,
              type: "properties",
              sender: "system",
              content: "",
              properties: filteredProperties.slice(0, 4),
            },
          ])
        })

        // Mettre à jour les filtres si la fonction est disponible
        if (onFilterChange) {
          onFilterChange({ minRate: rating })
        }
        return
      } else if (optionId === "filter-price") {
        simulateTyping(() => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "text",
              sender: "system",
              content: "Quel est votre budget par nuit ?",
            },
            {
              id: Date.now() + 1,
              type: "options",
              sender: "system",
              content: "",
              options: [
                { id: "price-100", text: "Moins de 100€", icon: "DollarSign" },
                { id: "price-200", text: "Entre 100€ et 200€", icon: "DollarSign" },
                { id: "price-300", text: "Entre 200€ et 300€", icon: "DollarSign" },
                { id: "price-max", text: "Plus de 300€", icon: "DollarSign" },
              ],
            },
          ])
        })
        return
      } else if (optionId.startsWith("price-")) {
        let minPrice = 0
        let maxPrice = 1000

        if (optionId === "price-100") {
          maxPrice = 100
        } else if (optionId === "price-200") {
          minPrice = 100
          maxPrice = 200
        } else if (optionId === "price-300") {
          minPrice = 200
          maxPrice = 300
        } else if (optionId === "price-max") {
          minPrice = 300
        }

        // Filtrer les propriétés par prix
        const filteredProperties = allProperties.filter(
          (property) =>
            (property.price || property.discountedPrice || 0) >= minPrice &&
            (property.price || property.discountedPrice || 0) <= maxPrice,
        )

        simulateTyping(() => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "text",
              sender: "system",
              content: `Voici les logements dans votre budget :`,
            },
            {
              id: Date.now() + 1,
              type: "properties",
              sender: "system",
              content: "",
              properties: filteredProperties.slice(0, 4),
            },
          ])
        })

        // Mettre à jour les filtres si la fonction est disponible
        if (onFilterChange && pageType === "rooms") {
          onFilterChange({ priceRange: [minPrice, maxPrice] })
        }
        return
      } else if (optionId === "filter-amenities") {
        simulateTyping(() => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "text",
              sender: "system",
              content: "Quels équipements sont importants pour vous ?",
            },
            {
              id: Date.now() + 1,
              type: "options",
              sender: "system",
              content: "",
              options: [
                { id: "wifi", text: "Wi-Fi", icon: "Wifi" },
                { id: "pool", text: "Piscine", icon: "Waves" },
                { id: "kitchen", text: "Cuisine équipée", icon: "Utensils" },
                { id: "parking", text: "Parking", icon: "Car" },
                { id: "view", text: "Belle vue", icon: "Sunset" },
              ],
              multiSelect: true,
            },
          ])
        })
        return
      } else if (optionId === "recommendations") {
        // Obtenir des recommandations aléatoires
        const recommendations = allProperties.sort(() => 0.5 - Math.random()).slice(0, 4)

        simulateTyping(() => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "text",
              sender: "system",
              content: "Voici quelques recommandations qui pourraient vous intéresser :",
            },
            {
              id: Date.now() + 1,
              type: "properties",
              sender: "system",
              content: "",
              properties: recommendations,
            },
          ])
        })
        return
      } else if (optionId === "destination") {
        simulateTyping(() => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "text",
              sender: "system",
              content: "Où souhaitez-vous séjourner ?",
            },
            {
              id: Date.now() + 1,
              type: "options",
              sender: "system",
              content: "",
              options: [
                { id: "mountain", text: "Montagne", icon: "Mountain" },
                { id: "beach", text: "Plage", icon: "Palmtree" },
                { id: "city", text: "Ville", icon: "Building" },
                { id: "flexible", text: "Je suis flexible", icon: "Sparkles" },
              ],
            },
          ])
        })
        return
      }

      // Mettre à jour le profil utilisateur en fonction de l'étape actuelle
      if (currentStep === 0) {
        setUserProfile((prev) => ({ ...prev, destination: optionId }))
      } else if (currentStep === 2) {
        setUserProfile((prev) => ({ ...prev, style: optionId }))
      } else if (currentStep === 3) {
        if (multiSelect) {
          setUserProfile((prev) => {
            const newEssentials = prev.essentials.includes(optionId)
              ? prev.essentials.filter((item) => item !== optionId)
              : [...prev.essentials, optionId]
            return { ...prev, essentials: newEssentials }
          })
          return
        } else {
          setUserProfile((prev) => ({ ...prev, essentials: [optionId] }))
        }
      } else if (currentStep === 4) {
        // Définir la plage de budget en fonction de l'option sélectionnée
        let budgetRange: number[] = [0, 0]
        switch (optionId) {
          case "budget1":
            budgetRange = [0, 75]
            break
          case "budget2":
            budgetRange = [75, 150]
            break
          case "budget3":
            budgetRange = [150, 300]
            break
          case "budget4":
            budgetRange = [300, 1000]
            break
        }
        setUserProfile((prev) => ({ ...prev, budget: budgetRange }))
      }

      // Si ce n'est pas une sélection multiple, passer à l'étape suivante
      if (!multiSelect) {
        goToNextStep()
      }
    },
    [currentStep, simulateTyping, allProperties, onFilterChange, pageType],
  )

  // Gérer la sélection de date
  const handleDateSelect = useCallback((start: string, end: string) => {
    // Ajouter la réponse de l'utilisateur
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "text",
        sender: "user",
        content: `Du ${new Date(start).toLocaleDateString()} au ${new Date(end).toLocaleDateString()}`,
      },
    ])

    // Mettre à jour le profil utilisateur
    setUserProfile((prev) => ({ ...prev, dates: { start, end } }))

    // Passer à l'étape suivante
    goToNextStep()
  }, [])

  // Passer à l'étape suivante de la conversation
  const goToNextStep = useCallback(() => {
    const nextStep = currentStep + 1

    // Si nous avons terminé toutes les étapes, afficher les recommandations
    if (nextStep >= 5) {
      simulateTyping(() => {
        // Ajouter un résumé et des recommandations
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "text",
            sender: "system",
            content: "Voici votre profil de recherche :",
          },
          {
            id: Date.now() + 1,
            type: "profile",
            sender: "system",
            content: "",
            profile: userProfile,
          },
          {
            id: Date.now() + 2,
            type: "text",
            sender: "system",
            content: "Voici quelques logements qui pourraient vous plaire :",
          },
          {
            id: Date.now() + 3,
            type: "properties",
            sender: "system",
            content: "",
            properties: getRecommendedProperties(),
          },
          {
            id: Date.now() + 4,
            type: "text",
            sender: "system",
            content: "Souhaitez-vous affiner votre recherche ?",
          },
          {
            id: Date.now() + 5,
            type: "options",
            sender: "system",
            content: "",
            options: [
              { id: "more-options", text: "Plus d'options", icon: "Sparkles" },
              { id: "adjust-dates", text: "Modifier les dates", icon: "Calendar" },
              { id: "adjust-budget", text: "Ajuster le budget", icon: "DollarSign" },
              { id: "new-search", text: "Nouvelle recherche", icon: "RefreshCw" },
            ],
          },
        ])
      })
    } else {
      // Passer à l'étape suivante
      setCurrentStep(nextStep)

      // Ajouter le message de l'étape suivante
      simulateTyping(() => {
        setChatMessages((prev) => {
          const newMessages = [...prev]

          // Ajouter un message texte pour l'étape
          newMessages.push({
            id: Date.now(),
            type: "text",
            sender: "system",
            content: getChatStepMessage(nextStep),
          })

          // Ajouter le composant approprié en fonction du type d'étape
          if (nextStep === 1) {
            newMessages.push({
              id: Date.now() + 1,
              type: "date",
              sender: "system",
              content: "",
            })
          } else if (nextStep === 2) {
            newMessages.push({
              id: Date.now() + 1,
              type: "options",
              sender: "system",
              content: "",
              options: [
                { id: "modern", text: "Moderne", icon: "Sparkles" },
                { id: "cozy", text: "Cosy", icon: "Coffee" },
                { id: "luxury", text: "Luxe", icon: "Star" },
                { id: "unique", text: "Insolite", icon: "Sparkles" },
              ],
            })
          } else if (nextStep === 3) {
            newMessages.push({
              id: Date.now() + 1,
              type: "options",
              sender: "system",
              content: "",
              options: [
                { id: "wifi", text: "Wi-Fi", icon: "Wifi" },
                { id: "pool", text: "Piscine", icon: "Waves" },
                { id: "kitchen", text: "Cuisine équipée", icon: "Utensils" },
                { id: "parking", text: "Parking", icon: "Car" },
                { id: "view", text: "Belle vue", icon: "Sunset" },
              ],
              multiSelect: true,
            })
          } else if (nextStep === 4) {
            newMessages.push({
              id: Date.now() + 1,
              type: "options",
              sender: "system",
              content: "",
              options: [
                { id: "budget1", text: "Économique (< 75€)" },
                { id: "budget2", text: "Modéré (75€-150€)" },
                { id: "budget3", text: "Confort (150€-300€)" },
                { id: "budget4", text: "Premium (300€+)" },
              ],
            })
          }

          return newMessages
        })
      })
    }
  }, [currentStep, simulateTyping, userProfile])

  // Obtenir le message pour chaque étape du chat
  const getChatStepMessage = useCallback((step: number) => {
    switch (step) {
      case 1:
        return "Pour quelles dates ?"
      case 2:
        return "Quel style de logement recherchez-vous ?"
      case 3:
        return "Quels équipements sont importants pour vous ?"
      case 4:
        return "Quel est votre budget par nuit ?"
      default:
        return "Que puis-je faire pour vous ?"
    }
  }, [])

  // Obtenir des propriétés recommandées en fonction du profil utilisateur
  const getRecommendedProperties = useCallback((): Property[] => {
    if (!isDataLoaded || allProperties.length === 0) {
      return []
    }

    let filteredProperties = [...allProperties]

    // Filtrer par destination si spécifiée
    if (userProfile.destination) {
      if (userProfile.destination === "mountain") {
        filteredProperties = filteredProperties.filter(
          (p) =>
            p.location.toLowerCase().includes("montagne") ||
            p.location.toLowerCase().includes("alpes") ||
            (p.tags && p.tags.some((tag) => tag.toLowerCase().includes("montagne"))),
        )
      } else if (userProfile.destination === "beach") {
        filteredProperties = filteredProperties.filter(
          (p) =>
            p.location.toLowerCase().includes("mer") ||
            p.location.toLowerCase().includes("plage") ||
            (p.tags && p.tags.some((tag) => tag.toLowerCase().includes("mer") || tag.toLowerCase().includes("plage"))),
        )
      } else if (userProfile.destination === "city") {
        filteredProperties = filteredProperties.filter(
          (p) =>
            p.location.toLowerCase().includes("ville") ||
            p.city?.toLowerCase().includes("paris") ||
            (p.tags &&
              p.tags.some((tag) => tag.toLowerCase().includes("ville") || tag.toLowerCase().includes("urbain"))),
        )
      }
    }

    // Filtrer par budget
    if (userProfile.budget[0] > 0 || userProfile.budget[1] < 1000) {
      filteredProperties = filteredProperties.filter((p) => {
        const price = p.price || p.discountedPrice || 0
        return price >= userProfile.budget[0] && price <= userProfile.budget[1]
      })
    }

    // Filtrer par équipements essentiels si spécifiés
    if (userProfile.essentials.length > 0) {
      filteredProperties = filteredProperties.filter((p) =>
        userProfile.essentials.some(
          (essential) =>
            p.amenities?.includes(essential) ||
            (p.tags && p.tags.some((tag) => tag.toLowerCase().includes(essential.toLowerCase()))),
        ),
      )
    }

    // Si aucune propriété ne correspond aux filtres, renvoyer toutes les propriétés
    if (filteredProperties.length === 0) {
      return allProperties.slice(0, 4)
    }

    return filteredProperties.slice(0, 4)
  }, [isDataLoaded, allProperties, userProfile])

  // Ajouter une propriété aux favoris
  const addToFavorites = useCallback(
    (propertyId: number | string) => {
      if (!selectedProperties.has(propertyId)) {
        setSelectedProperties((prev) => {
          const newSet = new Set(prev)
          newSet.add(propertyId)
          return newSet
        })

        // Ajouter un message de confirmation
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "text",
            sender: "system",
            content: "Logement ajouté à vos favoris !",
          },
        ])
      }
    },
    [selectedProperties],
  )

  // Afficher plus de suggestions de propriétés
  const showMoreSuggestions = useCallback(() => {
    // Ajouter un message utilisateur
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "text",
        sender: "user",
        content: "Je voudrais voir d'autres suggestions",
      },
    ])

    // Simuler la réponse de l'IA
    simulateTyping(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "text",
          sender: "system",
          content: "Voici d'autres logements qui pourraient vous intéresser :",
        },
        {
          id: Date.now() + 1,
          type: "properties",
          sender: "system",
          content: "",
          properties: getRecommendedProperties().sort(() => Math.random() - 0.5),
        },
      ])
    })
  }, [simulateTyping, getRecommendedProperties])

  // Affiner la recherche en fonction de l'option sélectionnée
  const refineSearch = useCallback(
    (optionId: string, optionText: string) => {
      // Ajouter un message utilisateur
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "text",
          sender: "user",
          content: optionText,
        },
      ])

      // Mettre à jour le profil utilisateur en fonction de la sélection
      if (optionId === "adjust-budget") {
        simulateTyping(() => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "text",
              sender: "system",
              content: "Quel est votre nouveau budget par nuit ?",
            },
            {
              id: Date.now() + 1,
              type: "options",
              sender: "system",
              content: "",
              options: [
                { id: "budget1", text: "Économique (< 75€)" },
                { id: "budget2", text: "Modéré (75€-150€)" },
                { id: "budget3", text: "Confort (150€-300€)" },
                { id: "budget4", text: "Premium (300€+)" },
              ],
            },
          ])
        })
        return
      } else if (optionId === "adjust-dates") {
        simulateTyping(() => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "text",
              sender: "system",
              content: "Quelles sont vos nouvelles dates ?",
            },
            {
              id: Date.now() + 1,
              type: "date",
              sender: "system",
              content: "",
            },
          ])
        })
        return
      } else if (optionId === "new-search") {
        // Réinitialiser le chat
        setChatMessages([
          {
            id: 1,
            type: "text",
            sender: "system",
            content: initialMessage,
          },
          {
            id: 2,
            type: "options",
            sender: "system",
            content: "",
            options: getInitialOptions(),
          },
        ])
        setCurrentStep(0)
        setUserProfile({
          destination: "",
          dates: { start: "", end: "" },
          style: "",
          essentials: [],
          budget: [100, 300],
          extras: [],
        })
        return
      }

      // Pour les autres options, afficher plus de suggestions
      simulateTyping(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "text",
            sender: "system",
            content: "Voici des logements qui pourraient mieux vous convenir :",
          },
          {
            id: Date.now() + 1,
            type: "properties",
            sender: "system",
            content: "",
            properties: getRecommendedProperties(),
          },
        ])
      })
    },
    [simulateTyping, getRecommendedProperties, initialMessage, getInitialOptions],
  )

  // Gérer la recherche par texte
  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return

      // Ajouter un message de chargement
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "loading",
          sender: "system",
          content: "Recherche en cours...",
        },
      ])

      // Simuler un délai de recherche
      setTimeout(() => {
        // Filtrer les propriétés en fonction de la requête de recherche
        const results = allProperties.filter((property) => {
          const searchLower = searchQuery.toLowerCase()
          return (
            property.name.toLowerCase().includes(searchLower) ||
            property.description.toLowerCase().includes(searchLower) ||
            property.location.toLowerCase().includes(searchLower) ||
            (property.tags && property.tags.some((tag) => tag.toLowerCase().includes(searchLower))) ||
            (property.categories && property.categories.toLowerCase().includes(searchLower))
          )
        })

        // Mettre à jour les messages du chat
        setChatMessages((prev) => {
          // Supprimer le message de chargement
          const filteredMessages = prev.filter((msg) => msg.type !== "loading")

          return [
            ...filteredMessages,
            {
              id: Date.now(),
              type: "text",
              sender: "system",
              content:
                results.length > 0
                  ? `J'ai trouvé ${results.length} résultat${results.length > 1 ? "s" : ""} pour "${searchQuery}" :`
                  : `Désolé, je n'ai trouvé aucun résultat pour "${searchQuery}". Voici quelques suggestions :`,
            },
            {
              id: Date.now() + 1,
              type: "properties",
              sender: "system",
              content: "",
              properties: results.length > 0 ? results.slice(0, 4) : getRecommendedProperties(),
            },
          ]
        })

        // Appeler la fonction de recherche externe si disponible
        if (onSearch) {
          onSearch(searchQuery)
        }
      }, 1500)
    },
    [allProperties, getRecommendedProperties, onSearch],
  )

  // Envoyer un message texte
  const sendMessage = useCallback(() => {
    if (inputMessage.trim()) {
      // Ajouter le message de l'utilisateur
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "text",
          sender: "user",
          content: inputMessage,
        },
      ])

      const userQuery = inputMessage.trim()
      setInputMessage("")

      // Traiter la requête de l'utilisateur
      if (
        userQuery.toLowerCase().includes("recherche") ||
        userQuery.toLowerCase().includes("cherche") ||
        userQuery.toLowerCase().includes("trouve")
      ) {
        handleSearch(userQuery)
      } else if (
        userQuery.toLowerCase().includes("budget") ||
        userQuery.toLowerCase().includes("prix") ||
        userQuery.toLowerCase().includes("euro")
      ) {
        simulateTyping(() => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "text",
              sender: "system",
              content: "Quel est votre budget par nuit ?",
            },
            {
              id: Date.now() + 1,
              type: "options",
              sender: "system",
              content: "",
              options: [
                { id: "price-100", text: "Moins de 100€", icon: "DollarSign" },
                { id: "price-200", text: "Entre 100€ et 200€", icon: "DollarSign" },
                { id: "price-300", text: "Entre 200€ et 300€", icon: "DollarSign" },
                { id: "price-max", text: "Plus de 300€", icon: "DollarSign" },
              ],
            },
          ])
        })
      } else if (
        userQuery.toLowerCase().includes("date") ||
        userQuery.toLowerCase().includes("quand") ||
        userQuery.toLowerCase().includes("jour")
      ) {
        simulateTyping(() => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "text",
              sender: "system",
              content: "Pour quelles dates souhaitez-vous réserver ?",
            },
            {
              id: Date.now() + 1,
              type: "date",
              sender: "system",
              content: "",
            },
          ])
        })
      } else if (
        userQuery.toLowerCase().includes("ville") ||
        userQuery.toLowerCase().includes("où") ||
        userQuery.toLowerCase().includes("destination")
      ) {
        simulateTyping(() => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "text",
              sender: "system",
              content: "Où souhaitez-vous séjourner ?",
            },
            {
              id: Date.now() + 1,
              type: "options",
              sender: "system",
              content: "",
              options: [
                { id: "mountain", text: "Montagne", icon: "Mountain" },
                { id: "beach", text: "Plage", icon: "Palmtree" },
                { id: "city", text: "Ville", icon: "Building" },
                { id: "flexible", text: "Je suis flexible", icon: "Sparkles" },
              ],
            },
          ])
        })
      } else {
        // Traiter comme une recherche générale
        handleSearch(userQuery)
      }
    }
  }, [inputMessage, simulateTyping, handleSearch])

  // Rendre les icônes
  const renderIcon = useCallback((iconName: string) => {
    switch (iconName) {
      case "Mountain":
        return <Mountain className="h-4 w-4" />
      case "Palmtree":
        return <Palmtree className="h-4 w-4" />
      case "Building":
        return <Building className="h-4 w-4" />
      case "Sparkles":
        return <Sparkles className="h-4 w-4" />
      case "Users":
        return <Users className="h-4 w-4" />
      case "Dumbbell":
        return <Dumbbell className="h-4 w-4" />
      case "Briefcase":
        return <Briefcase className="h-4 w-4" />
      case "Wifi":
        return <Wifi className="h-4 w-4" />
      case "Waves":
        return <Waves className="h-4 w-4" />
      case "Utensils":
        return <Utensils className="h-4 w-4" />
      case "Car":
        return <Car className="h-4 w-4" />
      case "Sunset":
        return <Sunset className="h-4 w-4" />
      case "Coffee":
        return <Coffee className="h-4 w-4" />
      case "RefreshCw":
        return <RefreshCw className="h-4 w-4" />
      case "DollarSign":
        return <DollarSign className="h-4 w-4" />
      case "Calendar":
        return <Calendar className="h-4 w-4" />
      case "Star":
        return <Star className="h-4 w-4" />
      case "Search":
        return <Search className="h-4 w-4" />
      case "Filter":
        return <Filter className="h-4 w-4" />
      case "Bed":
        return <Bed className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }, [])

  // Rendre les messages du chat
  const renderChatMessage = useCallback(
    (message: ChatMessage) => {
      switch (message.type) {
        case "text":
          return (
            <div
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} mb-4`}
              key={message.id}
            >
              {message.sender === "system" && (
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={botAvatar || "/placeholder.svg"} />
                  <AvatarFallback style={{ backgroundColor: accentColor, color: "white" }}>
                    {botName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[80%] rounded-2xl p-3 ${
                  message.sender === "user" ? "bg-gray-100 text-gray-800" : `text-black`
                }`}
                style={{ backgroundColor: message.sender === "user" ? "" : "#f0f0f0" }}
              >
                <p>{message.content}</p>
              </div>
              {message.sender === "user" && (
                <Avatar className="h-8 w-8 ml-2">
                  <AvatarImage src={userAvatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gray-300">U</AvatarFallback>
                </Avatar>
              )}
            </div>
          )
        case "options":
          return (
            <div className="mb-4" key={message.id}>
              <div className="flex flex-wrap gap-2">
                {message.options?.map((option) => (
                  <Button
                    key={option.id}
                    variant="outline"
                    className={`rounded-full flex items-center ${
                      message.multiSelect && userProfile.essentials.includes(option.id)
                        ? "bg-gray-100 border-gray-300"
                        : message.multiSelect && userProfile.extras.includes(option.id)
                          ? "bg-gray-100 border-gray-300"
                          : ""
                    }`}
                    onClick={() => {
                      if (currentStep <= 4) {
                        handleOptionSelect(option.id, option.text, message.multiSelect)
                      } else {
                        refineSearch(option.id, option.text)
                      }
                    }}
                  >
                    {option.icon && <span className="mr-2">{renderIcon(option.icon)}</span>}
                    {option.text}
                    {(message.multiSelect && userProfile.essentials.includes(option.id)) ||
                    (message.multiSelect && userProfile.extras.includes(option.id)) ? (
                      <Check className="ml-2 h-4 w-4" />
                    ) : null}
                  </Button>
                ))}
                {message.multiSelect && (
                  <Button
                    variant="default"
                    className="rounded-full text-white"
                    style={{ backgroundColor: accentColor }}
                    onClick={goToNextStep}
                  >
                    Continuer <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )
        case "date":
          return (
            <div className="mb-4" key={message.id}>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'arrivée</label>
                    <Input
                      type="date"
                      className="rounded-xl"
                      value={userProfile.dates.start}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          dates: { ...userProfile.dates, start: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de départ</label>
                    <Input
                      type="date"
                      className="rounded-xl"
                      value={userProfile.dates.end}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          dates: { ...userProfile.dates, end: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      handleOptionSelect("flexible", "Je suis flexible sur les dates")
                    }}
                  >
                    Je suis flexible
                  </Button>
                  <Button
                    variant="default"
                    className="rounded-full text-white"
                    style={{ backgroundColor: accentColor }}
                    onClick={() => {
                      if (userProfile.dates.start && userProfile.dates.end) {
                        handleDateSelect(userProfile.dates.start, userProfile.dates.end)
                      }
                    }}
                    disabled={!userProfile.dates.start || !userProfile.dates.end}
                  >
                    Confirmer
                  </Button>
                </div>
              </div>
            </div>
          )
        case "profile":
          return (
            <div className="mb-4" key={message.id}>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-medium mb-2">Votre profil de recherche</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Destination:</span>
                    <span className="font-medium">
                      {userProfile.destination === "mountain"
                        ? "Montagne"
                        : userProfile.destination === "beach"
                          ? "Plage"
                          : userProfile.destination === "city"
                            ? "Ville"
                            : "Flexible"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dates:</span>
                    <span className="font-medium">
                      {userProfile.dates.start && userProfile.dates.end
                        ? `${new Date(userProfile.dates.start).toLocaleDateString()} - ${new Date(
                            userProfile.dates.end,
                          ).toLocaleDateString()}`
                        : "Flexible"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Style:</span>
                    <span className="font-medium">
                      {userProfile.style === "modern"
                        ? "Moderne"
                        : userProfile.style === "cozy"
                          ? "Cosy"
                          : userProfile.style === "luxury"
                            ? "Luxe"
                            : userProfile.style === "unique"
                              ? "Insolite"
                              : "Non spécifié"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-medium">
                      {userProfile.budget[0]}€ - {userProfile.budget[1]}€
                    </span>
                  </div>
                  {userProfile.essentials.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Équipements:</span>
                      <div className="flex flex-wrap justify-end gap-1">
                        {userProfile.essentials.map((essential) => (
                          <Badge key={essential} className="bg-gray-200 text-gray-700">
                            {essential === "wifi"
                              ? "Wi-Fi"
                              : essential === "pool"
                                ? "Piscine"
                                : essential === "kitchen"
                                  ? "Cuisine équipée"
                                  : essential === "parking"
                                    ? "Parking"
                                    : essential === "view"
                                      ? "Belle vue"
                                      : essential}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        case "properties":
          return (
            <div className="mb-4" key={message.id}>
              <div className="space-y-3">
                {message.properties && message.properties.length > 0 ? (
                  message.properties.map((property) => (
                    <div
                      key={property.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="flex">
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                          <Image
                            src={property.image || "/placeholder.svg"}
                            alt={property.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-3 flex-grow">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-sm sm:text-base">{property.name}</h3>
                            <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
                              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 mr-1" />
                              <span className="text-xs">{property.rate}</span>
                            </div>
                          </div>
                          <p className="text-gray-500 text-xs sm:text-sm flex items-center mb-1">
                            <MapPin className="h-3 w-3 mr-1" /> {property.location}
                          </p>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{property.description}</p>
                          <div className="flex justify-between items-center">
                            <div>
                              {property.originalPrice && (
                                <span className="text-gray-400 line-through text-xs mr-1">
                                  €{property.originalPrice}
                                </span>
                              )}
                              <span className="font-bold text-sm">
                                €{property.discountedPrice || property.price || "N/A"}
                              </span>
                              <span className="text-gray-500 text-xs"> / nuit</span>
                            </div>
                            <Button
                              size="sm"
                              className="rounded-full text-white"
                              style={{ backgroundColor: accentColor }}
                              onClick={() => {
                                if (property.hotelId) {
                                  // Si c'est une chambre, naviguer vers la page de la chambre
                                  router.push(`/room/${property.id}`)
                                } else {
                                  // Si c'est un hôtel, naviguer vers la page de l'hôtel
                                  router.push(`/dashboard/hotels/${property.id}`)
                                }
                              }}
                            >
                              <span className="text-xs">Voir détails</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Aucun logement ne correspond à vos critères.</p>
                    <Button
                      variant="outline"
                      className="mt-2 rounded-full"
                      onClick={() => refineSearch("new-search", "Nouvelle recherche")}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Nouvelle recherche
                    </Button>
                  </div>
                )}
                {message.properties && message.properties.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl flex items-center justify-center"
                    onClick={showMoreSuggestions}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Voir d'autres logements
                  </Button>
                )}
              </div>
            </div>
          )
        case "loading":
          return (
            <div className="flex mb-4" key={message.id}>
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={botAvatar || "/placeholder.svg"} />
                <AvatarFallback style={{ backgroundColor: accentColor, color: "white" }}>
                  {botName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl p-3 flex items-center" style={{ backgroundColor: "#f0f0f0" }}>
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )
        case "search":
          return (
            <div className="mb-4" key={message.id}>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Tapez votre recherche..."
                      className="pl-9 pr-4 py-2 rounded-xl"
                      value={message.searchQuery || ""}
                      onChange={(e) => {
                        setChatMessages((prev) =>
                          prev.map((msg) => (msg.id === message.id ? { ...msg, searchQuery: e.target.value } : msg)),
                        )
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && message.searchQuery) {
                          e.preventDefault()
                          handleSearch(message.searchQuery)
                        }
                      }}
                    />
                  </div>
                  <Button
                    className="ml-2 rounded-xl text-white"
                    style={{ backgroundColor: accentColor }}
                    onClick={() => {
                      if (message.searchQuery) {
                        handleSearch(message.searchQuery)
                      }
                    }}
                  >
                    Rechercher
                  </Button>
                </div>
              </div>
            </div>
          )
        default:
          return null
      }
    },
    [
      accentColor,
      botAvatar,
      botName,
      currentStep,
      goToNextStep,
      handleDateSelect,
      handleOptionSelect,
      handleSearch,
      refineSearch,
      renderIcon,
      router,
      showMoreSuggestions,
      userAvatar,
      userProfile,
    ],
  )

  // Style de position en fonction de la prop
  const getPositionStyle = useCallback(() => {
    switch (position) {
      case "bottom-left":
        return "left-6"
      case "bottom-center":
        return "left-1/2 transform -translate-x-1/2"
      case "bottom-right":
      default:
        return "right-6"
    }
  }, [position])

  return (
    <>
      {/* Bouton du chat */}
      {!chatOpen ? (
        <Button
          className={`fixed bottom-6 ${getPositionStyle()} rounded-full w-14 h-14 shadow-lg flex items-center justify-center text-white z-50`}
          style={{ backgroundColor: accentColor }}
          onClick={() => setChatOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      ) : (
        <div
          className={cn(
            `fixed bottom-6 ${getPositionStyle()} bg-white rounded-2xl shadow-xl w-full max-w-sm transition-all duration-300 flex flex-col z-50`,
            chatMinimized ? "h-14" : "h-[600px]",
          )}
        >
          {/* En-tête du chat */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: `${accentColor}20` }}>
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={botAvatar || "/placeholder.svg"} />
                <AvatarFallback style={{ backgroundColor: accentColor, color: "white" }}>
                  {botName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-sm">{botName}</h3>
                <p className="text-xs text-gray-500">En ligne</p>
              </div>
            </div>
            <div className="flex items-center">
              {chatMinimized ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => setChatMinimized(false)}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => setChatMinimized(true)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full ml-1"
                onClick={() => setChatOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Contenu du chat */}
          {!chatMinimized && (
            <>
              <div className="flex-grow overflow-y-auto p-4">
                {chatMessages.map((message) => renderChatMessage(message))}
                {isTyping && (
                  <div className="flex mb-4">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={botAvatar || "/placeholder.svg"} />
                      <AvatarFallback style={{ backgroundColor: accentColor, color: "white" }}>
                        {botName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl p-3 flex items-center" style={{ backgroundColor: "#f0f0f0" }}>
                      <div className="flex space-x-1">
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Saisie du chat */}
              <div className="p-4 border-t">
                <div className="flex items-center">
                  <Input
                    placeholder="Écrivez votre message..."
                    className="rounded-full"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <Button
                    className="ml-2 h-10 w-10 rounded-full p-0 text-white"
                    style={{ backgroundColor: accentColor }}
                    onClick={sendMessage}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

export default HotelChatbot
