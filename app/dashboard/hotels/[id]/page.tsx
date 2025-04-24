"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Edit, Plus, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoomsList } from "./rooms-list"
import { useAuth } from "@/lib/auth-context"
import { Hotel } from "@/models"

export default function HotelDetailPage() {
  const { user, isLoading } = useAuth()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const hotelId = Array.isArray(params.id) ? params.id[0] : params.id

  useEffect(() => {
    // Fonction pour récupérer les détails de l'hôtel via l'API
    const fetchHotelDetails = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/dashboard/hotels/${hotelId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            // Rediriger vers une page 404 si l'hôtel n'est pas trouvé
            router.push("/404")
            return
          }
          throw new Error("Erreur lors de la récupération des détails de l'hôtel")
        }
        
        const data = await response.json()
        setHotel(data.hotel)
      } catch (err) {
        console.error("Erreur:", err)
        setError(err instanceof Error ? err.message : "Une erreur est survenue")
      } finally {
        setDataLoading(false)
      }
    }

    if (!isLoading && user) {
      fetchHotelDetails()
    } else if (!isLoading && !user) {
      setDataLoading(false)
    }
  }, [user, isLoading, hotelId, router])

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!isLoading && !user) {
    return <div className="p-4">Veuillez vous connecter pour accéder aux détails de l'hôtel</div>
  }

  // Afficher un indicateur de chargement pendant que les données sont récupérées
  if (isLoading || dataLoading) {
    return <div className="p-4">Chargement...</div>
  }

  // Afficher un message d'erreur si la récupération des données a échoué
  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  // Gérer le cas où l'hôtel n'est pas trouvé
  if (!hotel) {
    return <div className="p-4">Hôtel non trouvé ou vous n'avez pas l'autorisation d'y accéder</div>
  }

  // Calcul des statistiques
  const averagePrice = hotel.rooms.length > 0
    ? (hotel.rooms.reduce((sum, room) => sum + room.price, 0) / hotel.rooms.length).toFixed(2)
    : "0.00";

  const averageRating = hotel.rooms.length > 0
    ? (hotel.rooms.reduce((sum, room) => sum + room.rate, 0) / hotel.rooms.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{hotel.name}</h2>
        <Link href={`/dashboard/hotels/${hotel.id}/edit`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Hotel
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hotel Information</CardTitle>
            <CardDescription>Basic details about your hotel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <div className="text-sm font-medium text-muted-foreground">Name:</div>
              <div>{hotel.name}</div>

              <div className="text-sm font-medium text-muted-foreground">Rating:</div>
              <div className="flex items-center">
                <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                {hotel.rate.toFixed(1)}
              </div>

              <div className="text-sm font-medium text-muted-foreground">Address:</div>
              <div>
                {hotel.address}, {hotel.city}, {hotel.zipCode}
              </div>

              <div className="text-sm font-medium text-muted-foreground">Phone:</div>
              <div>{hotel.phone}</div>

              <div className="text-sm font-medium text-muted-foreground">Rooms:</div>
              <div>{hotel.rooms.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hotel Statistics</CardTitle>
            <CardDescription>Overview of your hotel performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Total Rooms</div>
                <div className="text-2xl font-bold">{hotel.rooms.length}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Average Price</div>
                <div className="text-2xl font-bold">
                  ${averagePrice}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Average Rating</div>
                <div className="text-2xl font-bold flex items-center">
                  {averageRating}
                  <Star className="ml-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Created</div>
                <div className="text-lg font-medium">{new Date(hotel.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rooms" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>
        <TabsContent value="rooms" className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium">Hotel Rooms</h3>
            <Link href={`/dashboard/hotels/${hotel.id}/rooms/new`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Room
              </Button>
            </Link>
          </div>
          <RoomsList rooms={hotel.rooms} hotelId={hotel.id} />
        </TabsContent>
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>View and manage bookings for this hotel</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Bookings functionality coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}