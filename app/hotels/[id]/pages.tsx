"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Building2,
  MapPin,
  Phone,
  Star,
  Layers,
  ChevronRight,
  ArrowLeft,
  Bed,
  DollarSign,
  Clock,
  Heart,
  Share2,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import LeafletMap from "@/components/leaflet-map"
import HotelChatbot from "@/components/chatbot"

// Type pour l'hôtel avec toutes ses relations
type RoomType = {
  type: {
    id: string
    name: string
  }
}

type Booking = {
  startDate: string
  endDate: string
}

type Negotiation = {
  status: string
  price: number
  startDate: string
  endDate: string
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
  createdAt: string
  updatedAt: string
  types: RoomType[]
  bookings: Booking[]
  negotiations: Negotiation[]
}

type EnhancedHotel = {
  id: string
  name: string
  rate: number
  address: string
  city: string
  zipCode: string
  phone: string
  createdAt: string
  updatedAt: string
  rooms: Room[]
  roomCount: number
  minPrice: number
  maxPrice: number
  averageRoomRate: number
  roomTypes: string[]
  roomCategories: string[]
  roomTags: string[]
}

export default function HotelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [hotel, setHotel] = useState<EnhancedHotel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Récupérer les détails de l'hôtel
  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/hotels/${params.id}`)

        if (!response.ok) {
          throw new Error("Impossible de récupérer les détails de l'hôtel")
        }

        const data = await response.json()
        setHotel(data)
      } catch (err) {
        setError("Une erreur est survenue lors du chargement des détails de l'hôtel")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchHotelDetails()
    }
  }, [params.id])

  // Fonction pour formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  // Fonction pour générer des étoiles basées sur la note
  const renderStars = (rate: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${index < Math.floor(rate) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  // Fonction pour ajouter/retirer des favoris
  const toggleFavorite = (roomId: string) => {
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

  // Afficher un état de chargement
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full rounded-xl mb-8" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-24 w-full mb-8" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          </div>

          <div>
            <Skeleton className="h-64 w-full rounded-xl mb-6" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // Afficher un message d'erreur
  if (error || !hotel) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">{error || "Hôtel non trouvé"}</h2>
          <p className="text-red-600 mb-4">
            Impossible de charger les détails de cet hôtel. Veuillez réessayer ultérieurement.
          </p>
          <Button onClick={() => router.push("/hotels")}>Retourner à la liste des hôtels</Button>
        </div>
      </div>
    )
  }

  // Calculer la disponibilité des chambres
  const getAvailableRooms = () => {
    const now = new Date()
    return hotel.rooms.filter((room) => {
      // Vérifier si la chambre n'a pas de réservation active
      const hasActiveBooking = room.bookings.some((booking) => {
        const startDate = new Date(booking.startDate)
        const endDate = new Date(booking.endDate)
        return now >= startDate && now <= endDate
      })

      return !hasActiveBooking
    })
  }

  const availableRooms = getAvailableRooms()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Bouton de retour et titre */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{hotel.name}</h1>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-white px-3 py-1 rounded-full border">
            {renderStars(hotel.rate)}
            <span className="ml-2 font-medium">{hotel.rate.toFixed(1)}</span>
          </div>

          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Partager
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2">
          {/* Image principale */}
          <div className="relative rounded-xl overflow-hidden mb-8 aspect-[16/9]">
            <img src="/hotel.jpg" alt={hotel.name} className="object-cover w-full h-full" />
            {hotel.rate >= 4.5 && (
              <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-sm">
                <span className="mr-1">🏆</span>
                <span>Top noté</span>
              </div>
            )}
          </div>

          {/* Onglets */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="rooms">Chambres</TabsTrigger>
              <TabsTrigger value="location">Localisation</TabsTrigger>
              <TabsTrigger value="reviews">Avis</TabsTrigger>
            </TabsList>

            {/* Vue d'ensemble */}
            <TabsContent value="overview" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">À propos de {hotel.name}</h2>
                <p className="text-gray-700 mb-6">
                  {hotel.name} est un établissement {hotel.rate >= 4 ? "de luxe" : "confortable"} situé à {hotel.city}.
                  Avec {hotel.roomCount} chambres disponibles, cet hôtel offre un excellent rapport qualité-prix avec
                  des tarifs allant de {formatPrice(hotel.minPrice)} à {formatPrice(hotel.maxPrice)} par nuit.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <Bed className="h-8 w-8 text-blue-600 mb-2" />
                      <h3 className="font-medium">Chambres</h3>
                      <p className="text-2xl font-bold">{hotel.roomCount}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <DollarSign className="h-8 w-8 text-green-600 mb-2" />
                      <h3 className="font-medium">Prix moyen</h3>
                      <p className="text-2xl font-bold">{formatPrice((hotel.minPrice + hotel.maxPrice) / 2)}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <Star className="h-8 w-8 text-yellow-500 mb-2" />
                      <h3 className="font-medium">Note moyenne</h3>
                      <p className="text-2xl font-bold">{hotel.rate.toFixed(1)}/5</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Types de chambres</h2>
                <div className="flex flex-wrap gap-2 mb-6">
                  {hotel.roomTypes.map((type, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Catégories</h2>
                <div className="flex flex-wrap gap-2 mb-6">
                  {hotel.roomCategories.map((category, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {hotel.roomTags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-sm"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Chambres */}
            <TabsContent value="rooms">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Chambres disponibles</h2>
                <p className="text-gray-600 mb-4">
                  {availableRooms.length} chambre{availableRooms.length !== 1 ? "s" : ""} disponible
                  {availableRooms.length !== 1 ? "s" : ""} sur {hotel.roomCount}
                </p>

                <div className="space-y-6">
                  {hotel.rooms.map((room) => (
                    <Card key={room.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/3 relative">
                          <img
                            src="/hotel.jpg"
                            alt={room.name}
                            className="w-full h-full object-cover aspect-video md:aspect-auto"
                          />
                          <button onClick={() => toggleFavorite(room.id)} className="absolute top-3 right-3 z-10">
                            <Heart
                              className={`h-6 w-6 ${
                                favorites.has(room.id)
                                  ? "fill-red-500 text-red-500"
                                  : "text-white stroke-2 drop-shadow-md"
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
              </div>
            </TabsContent>

            {/* Localisation */}
            <TabsContent value="location">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Localisation</h2>
                {/* 
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border mb-6">
                  <div className="h-[400px] w-full">
                    <LeafletMap address={`${hotel.address}, ${hotel.zipCode} ${hotel.city}`} name={hotel.name} />
                  </div>
                </div>
                */}
                <Card>
                  <CardHeader>
                    <CardTitle>Adresse complète</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                        <div>
                          <p className="font-medium">{hotel.name}</p>
                          <p className="text-gray-600">{hotel.address}</p>
                          <p className="text-gray-600">
                            {hotel.zipCode} {hotel.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-gray-500 mr-3" />
                        <p className="text-gray-600">{hotel.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Avis */}
            <TabsContent value="reviews">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Avis et évaluations</h2>

                <div className="bg-white rounded-xl p-6 border mb-6">
                  <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                    <div className="text-center md:text-left mb-4 md:mb-0">
                      <p className="text-gray-600 mb-1">Note globale</p>
                      <div className="flex items-center justify-center md:justify-start">
                        <span className="text-4xl font-bold mr-2">{hotel.rate.toFixed(1)}</span>
                        <div className="flex">{renderStars(hotel.rate)}</div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Basé sur les notes des chambres</p>
                    </div>

                    <div className="w-full md:w-1/2">
                      <div className="space-y-2">
                        {[
                          { label: "Propreté", value: 4.7 },
                          { label: "Confort", value: 4.5 },
                          { label: "Emplacement", value: 4.8 },
                          { label: "Service", value: 4.6 },
                          { label: "Rapport qualité-prix", value: 4.3 },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center">
                            <span className="w-32 text-sm text-gray-600">{item.label}</span>
                            <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${(item.value / 5) * 100}%` }}
                              ></div>
                            </div>
                            <span className="w-10 text-right text-sm font-medium ml-2">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Les avis des clients seront bientôt disponibles pour cet hôtel.
                    </p>
                    <Button variant="outline">Soyez le premier à donner votre avis</Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Colonne latérale */}
        <div>
          {/* Carte d'information */}
          <Card className="mb-6 sticky top-6">
            <CardHeader>
              <CardTitle>Informations</CardTitle>
              <CardDescription>Détails sur l'hôtel</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-start">
                <Building2 className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">Établissement</p>
                  <p className="text-gray-600">{hotel.name}</p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">Adresse</p>
                  <p className="text-gray-600">{hotel.address}</p>
                  <p className="text-gray-600">
                    {hotel.zipCode} {hotel.city}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="font-medium">Téléphone</p>
                  <p className="text-gray-600">{hotel.phone}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Star className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="font-medium">Note</p>
                  <div className="flex items-center">
                    {renderStars(hotel.rate)}
                    <span className="ml-2">{hotel.rate.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <Bed className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="font-medium">Chambres</p>
                  <p className="text-gray-600">{hotel.roomCount} disponibles</p>
                </div>
              </div>

              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="font-medium">Prix</p>
                  <p className="text-gray-600">
                    De {formatPrice(hotel.minPrice)} à {formatPrice(hotel.maxPrice)}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="font-medium">Dernière mise à jour</p>
                  <p className="text-gray-600">{new Date(hotel.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3">
              <Button className="w-full">Réserver maintenant</Button>
              <Button variant="outline" className="w-full">
                Contacter l'hôtel
              </Button>
            </CardFooter>
          </Card>

          {/* Carte des types de chambres */}
          <Card>
            <CardHeader>
              <CardTitle>Types de chambres</CardTitle>
              <CardDescription>Disponibles dans cet hôtel</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {hotel.roomTypes.map((type, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Layers className="h-5 w-5 text-blue-600 mr-3" />
                      <span>{type}</span>
                    </div>
                    <Badge variant="outline">
                      {hotel.rooms.filter((room) => room.types.some((t) => t.type.name === type)).length} chambres
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chatbot */}
      <HotelChatbot
        pageType="hotels"
        botName="Match Room Assistant"
        accentColor="#6366f1"
        position="bottom-right"
        initialMessage={`Bonjour ! Je peux vous aider à en savoir plus sur ${hotel.name}. Que souhaitez-vous savoir ?`}
      />
    </div>
  )
}
