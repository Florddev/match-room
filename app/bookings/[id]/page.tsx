"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Loader2, Calendar, Bed, Home, AlertTriangle, TicketX } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function BookingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Récupérer toutes les réservations de l'utilisateur
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/bookings`)
        
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des réservations")
        }
        
        const data = await response.json()
        setBookings(data.bookings)
      } catch (err) {
        console.error("Erreur:", err)
        setError(err instanceof Error ? err.message : "Une erreur est survenue")
      } finally {
        setDataLoading(false)
      }
    }

    if (!authLoading && user) {
      fetchBookings()
    } else if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Filtrer les réservations par statut (à venir, passées)
  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.endDate) >= new Date()
  )

  const pastBookings = bookings.filter(booking => 
    new Date(booking.endDate) < new Date()
  )

  // Afficher le chargement
  if (authLoading || dataLoading) {
    return (
      <div className="container py-10 flex justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Chargement de vos réservations...</span>
      </div>
    )
  }

  // Afficher l'erreur
  if (error) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Erreur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Composant pour afficher une réservation
  const BookingCard = ({ booking }: { booking: any }) => {
    const startDate = new Date(booking.startDate)
    const endDate = new Date(booking.endDate)
    const stayDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const totalPrice = booking.price * stayDuration
    const isPast = endDate < new Date()

    return (
      <Card className={isPast ? "opacity-80" : ""}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{booking.room.name}</CardTitle>
              <CardDescription>{booking.room.hotel.name}</CardDescription>
            </div>
            <Badge variant={isPast ? "outline" : "default"}>
              {isPast ? "Terminé" : "À venir"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="font-medium">Dates:</span>
              </div>
              <p className="text-sm">{formatDate(startDate)} - {formatDate(endDate)}</p>
              <p className="text-xs text-muted-foreground">{stayDuration} {stayDuration > 1 ? 'nuits' : 'nuit'}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-sm">
                <Bed className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="font-medium">Chambre:</span>
              </div>
              <p className="text-sm">{booking.room.name}</p>
              <p className="text-xs text-muted-foreground">
                {booking.room.types.map((t: any) => t.type.name).join(", ")}
              </p>
            </div>
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Prix total:</p>
              <p className="text-sm">{formatCurrency(totalPrice)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Réservation #</p>
              <p className="text-xs text-muted-foreground">{booking.id.substring(0, 8)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => router.push(`/bookings/${booking.id}`)}
          >
            Voir les détails
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Afficher la liste des réservations
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Mes réservations</h1>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming" className="relative">
            À venir
            {upcomingBookings.length > 0 && (
              <Badge className="ml-2">{upcomingBookings.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past">
            Historique
            {pastBookings.length > 0 && (
              <Badge variant="outline" className="ml-2">{pastBookings.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          {upcomingBookings.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="flex flex-col items-center justify-center space-y-2">
                  <TicketX className="h-8 w-8 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Aucune réservation à venir</h3>
                  <p className="text-sm text-muted-foreground">
                    Vous n'avez pas encore de réservations prévues.
                  </p>
                  <Button className="mt-4" onClick={() => router.push("/")}>
                    Explorer les chambres disponibles
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past">
          {pastBookings.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="flex flex-col items-center justify-center space-y-2">
                  <TicketX className="h-8 w-8 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Aucune réservation passée</h3>
                  <p className="text-sm text-muted-foreground">
                    Votre historique de réservation est vide.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}