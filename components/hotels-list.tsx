"use client"

import Link from "next/link"
import { Building2, MapPin, Phone, Star, BedDouble, Edit, Trash } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Hotel } from "@/models"

interface HotelsListProps {
  hotels: Hotel[]
}

export function HotelsList({ hotels }: HotelsListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()

  const deleteHotel = async (hotelId: string) => {
    if (isDeleting) return

    setIsDeleting(hotelId)

    try {
      const response = await fetch(`/api/dashboard/hotels/${hotelId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete hotel")
      }

      toast("Hôtel supprimé", {
        description: "L'hôtel a été supprimé avec succès.",
      })

      // Rafraîchir la page pour mettre à jour les données
      router.refresh()
    } catch (error) {
      console.error("Error deleting hotel:", error)
      toast("Erreur", {
        description: "Impossible de supprimer l'hôtel. Veuillez réessayer.",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {hotels.map((hotel) => (
        <Card key={hotel.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{hotel.name}</CardTitle>
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="ml-1 text-sm font-medium">{hotel.rate.toFixed(1)}</span>
              </div>
            </div>
            <CardDescription className="flex items-center text-sm">
              <MapPin className="mr-1 h-3.5 w-3.5" />
              {hotel.city}, {hotel.zipCode}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <Building2 className="mr-2 mt-0.5 h-4 w-4 text-muted-foreground" />
                <span>{hotel.address}</span>
              </div>
              <div className="flex items-center">
                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{hotel.phone}</span>
              </div>
              <div className="flex items-center">
                <BedDouble className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>
                  {hotel.rooms?.length || 0} {hotel.rooms?.length === 1 ? "chambre" : "chambres"}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-3">
            <Link href={`/dashboard/hotels/${hotel.id}`}>
              <Button variant="outline" size="sm">
                Voir détails
              </Button>
            </Link>
            <div className="flex space-x-2">
              <Link href={`/dashboard/hotels/${hotel.id}/edit`}>
                <Button size="sm" variant="ghost">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="text-destructive" disabled={isDeleting === hotel.id}>
                    {isDeleting === hotel.id ? (
                      <span className="animate-spin">...</span>
                    ) : (
                      <Trash className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action ne peut pas être annulée. Cela supprimera définitivement l'hôtel "{hotel.name}" et
                      toutes ses chambres.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteHotel(hotel.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
