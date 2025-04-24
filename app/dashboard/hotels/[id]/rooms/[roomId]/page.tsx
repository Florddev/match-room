"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Edit, Star, Tag, ListFilter, CalendarRange } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { NegotiationsList } from "@/components/negotiations-list"
/*import { NegotiationsCalendar } from "@/components/negotiations-calendar"*/
import { NegotiationsCalendar } from "@/components/negotiations-calendar"

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

  if (!isLoading && !user) {
    return <div className="p-4">Veuillez vous connecter pour accéder aux détails de la chambre</div>
  }

  if (isLoading || dataLoading) {
    return <div className="p-4">Chargement...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  if (!room) {
    return <div className="p-4">Chambre non trouvée ou vous n'avez pas l'autorisation d'y accéder</div>
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
            Edit Room
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Room Information</CardTitle>
            <CardDescription>Basic details about this room</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <div className="text-sm font-medium text-muted-foreground">Name:</div>
              <div>{room.name}</div>

              <div className="text-sm font-medium text-muted-foreground">Price:</div>
              <div>${room.price.toFixed(2)} per night</div>

              <div className="text-sm font-medium text-muted-foreground">Rating:</div>
              <div className="flex items-center">
                <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                {room.rate.toFixed(1)}
              </div>

              <div className="text-sm font-medium text-muted-foreground">Types:</div>
              <div className="flex flex-wrap gap-1">
                {room.types.map((roomType) => (
                  <Badge key={roomType.typeId} variant="secondary">
                    {roomType.type.name}
                  </Badge>
                ))}
              </div>

              <div className="text-sm font-medium text-muted-foreground">Categories:</div>
              <div className="flex flex-wrap gap-1">
                {room.categories.split(",").map((category: string, i: number) => (
                  <Badge key={i} variant="outline">
                    {category.trim()}
                  </Badge>
                ))}
              </div>

              <div className="text-sm font-medium text-muted-foreground">Tags:</div>
              <div className="flex items-center">
                <Tag className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                {room.tags}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room Description</CardTitle>
            <CardDescription>Detailed information about this room</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{room.content}</p>
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
              <CardDescription>
                Gérez les demandes de négociation de prix pour cette chambre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NegotiationsList 
                hotelId={hotelId} 
                roomId={roomId} 
                originalPrice={room.price} 
              />
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
              <CardDescription>
                Visualisez et gérez vos négociations dans un calendrier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NegotiationsCalendar 
                hotelId={hotelId} 
                roomId={roomId} 
                originalPrice={room.price} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Onglet des réservations */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Booking History</CardTitle>
              <CardDescription>Recent bookings for this room</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Booking history functionality coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}