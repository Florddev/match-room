"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Edit, Star, Tag, ListFilter, CalendarRange, BedDouble, DollarSign, Clock, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { NegotiationsList } from "@/components/negotiations-list"
import { NegotiationsCalendar } from "@/components/negotiations-calendar"
import { Skeleton } from "@/components/ui/skeleton"

type RoomType = {
  id: string
  name: string
}

type TypeRelation = {
  id: string
  roomId: string
  typeId: string
  type: RoomType
}

type Hotel = {
  id: string
  name: string
}

type Room = {
  id: string
  name: string
  description: string | null
  content: string | null
  price: number
  rate: number
  categories: string
  tags: string
  hotelId: string
  createdAt: string
  updatedAt: string
  types: TypeRelation[]
  hotel: Hotel
}

export default function RoomDetailPage() {
  const { user, isLoading } = useAuth()
  const [room, setRoom] = useState<Room | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const hotelId = Array.isArray(params.id) ? params.id[0] : params.id || ""
  const roomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId || ""

  useEffect(() => {
    const fetchRoomDetails = async () => {
      if (!user) return
      if (!hotelId || !roomId) {
        setError("Identifiants de l'hôtel ou de la chambre non valides")
        return
      }

      try {
        const response = await fetch(`/api/dashboard/hotels/${hotelId}/rooms/${roomId}`)

        if (!response.ok) {
          if (response.status === 404) {
            router.push("/404")
            return
          }
          throw new Error("Erreur lors de la récupération des détails de la chambre")
        }

        const data = await response.json()
        setRoom(data.room)
      } catch (err) {
        console.error("Erreur:", err)
        setError(err instanceof Error ? err.message : "Une erreur est survenue")
      } finally {
        setDataLoading(false)
      }
    }

    if (!isLoading && user) {
      fetchRoomDetails()
    } else if (!isLoading && !user) {
      setDataLoading(false)
    }
  }, [user, isLoading, hotelId, roomId, router])

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!isLoading && !user) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès restreint</CardTitle>
            <CardDescription>Veuillez vous connecter pour accéder aux détails de la chambre</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/auth/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Afficher un indicateur de chargement pendant que les données sont récupérées
  if (isLoading || dataLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="mt-2 h-4 w-[150px]" />
          </div>
          <Skeleton className="h-10 w-[120px]" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>

        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  // Afficher un message d'erreur si la récupération des données a échoué
  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Détails de la chambre</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
            >
              Réessayer
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Gérer le cas où la chambre n'est pas trouvée
  if (!room) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Détails de la chambre</h2>
        <Card>
          <CardHeader>
            <CardTitle>Chambre non trouvée</CardTitle>
          </CardHeader>
          <CardContent>
            <p>La chambre que vous recherchez n'existe pas ou vous n'avez pas l'autorisation d'y accéder.</p>
            <Link href={`/dashboard/hotels/${hotelId}`}>
              <Button className="mt-4">Retour à l'hôtel</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{room.name}</h2>
          <p className="text-muted-foreground">
            <Link href={`/dashboard/hotels/${hotelId}`} className="hover:underline">
              {room.hotel.name}
            </Link>
          </p>
        </div>
        <Link href={`/dashboard/hotels/${hotelId}/rooms/${roomId}/edit`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Modifier la chambre
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations sur la chambre</CardTitle>
            <CardDescription>Détails de base sur cette chambre</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <div className="text-sm font-medium text-muted-foreground">Nom:</div>
              <div>{room.name}</div>

              <div className="text-sm font-medium text-muted-foreground">Prix:</div>
              <div className="flex items-center">
                <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                {room.price.toFixed(2)} par nuit
              </div>

              <div className="text-sm font-medium text-muted-foreground">Note:</div>
              <div className="flex items-center">
                <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                {room.rate.toFixed(1)}
              </div>

              <div className="text-sm font-medium text-muted-foreground">Types:</div>
              <div className="flex flex-wrap gap-1">
                {room.types.length > 0 ? (
                  room.types.map((roomType) => (
                    <Badge key={roomType.typeId} variant="secondary">
                      {roomType.type.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Aucun type défini</span>
                )}
              </div>

              <div className="text-sm font-medium text-muted-foreground">Catégories:</div>
              <div className="flex flex-wrap gap-1">
                {room.categories
                  .split(",")
                  .filter(Boolean)
                  .map((category: string, i: number) => (
                    <Badge key={i} variant="outline">
                      {category.trim()}
                    </Badge>
                  ))}
              </div>

              <div className="text-sm font-medium text-muted-foreground">Tags:</div>
              <div className="flex items-center">
                <Tag className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                {room.tags || "Aucun tag"}
              </div>

              <div className="text-sm font-medium text-muted-foreground">Créée le:</div>
              <div className="flex items-center">
                <Calendar className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                {new Date(room.createdAt).toLocaleDateString()}
              </div>

              <div className="text-sm font-medium text-muted-foreground">Mise à jour:</div>
              <div className="flex items-center">
                <Clock className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                {new Date(room.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description de la chambre</CardTitle>
            <CardDescription>Informations détaillées sur cette chambre</CardDescription>
          </CardHeader>
          <CardContent>
            {room.content ? (
              <p className="whitespace-pre-line">{room.content}</p>
            ) : (
              <div className="flex h-[100px] items-center justify-center text-center">
                <p className="text-sm text-muted-foreground">Aucune description disponible pour cette chambre</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="negotiations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="negotiations">Négociations</TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1">
            <CalendarRange className="h-4 w-4" />
            <span>Calendrier</span>
          </TabsTrigger>
          <TabsTrigger value="bookings">Réservations</TabsTrigger>
        </TabsList>

        {/* Onglet des négociations (vue liste) */}
        <TabsContent value="negotiations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListFilter className="h-5 w-5" />
                Liste des négociations
              </CardTitle>
              <CardDescription>Gérez les demandes de négociation de prix pour cette chambre</CardDescription>
            </CardHeader>
            <CardContent>
              <NegotiationsList hotelId={hotelId} roomId={roomId} originalPrice={room.price} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet du calendrier des négociations */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5" />
                Calendrier des négociations
              </CardTitle>
              <CardDescription>Visualisez et gérez vos négociations dans un calendrier</CardDescription>
            </CardHeader>
            <CardContent>
              <NegotiationsCalendar hotelId={hotelId} roomId={roomId} originalPrice={room.price} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet des réservations */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Historique des réservations</CardTitle>
              <CardDescription>Réservations récentes pour cette chambre</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[200px] items-center justify-center">
                <div className="flex flex-col items-center text-center">
                  <BedDouble className="mb-2 h-16 w-16 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Aucune réservation</h3>
                  <p className="text-sm text-muted-foreground">Les réservations pour cette chambre apparaîtront ici</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
