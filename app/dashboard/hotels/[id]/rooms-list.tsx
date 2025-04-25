"use client"

import Link from "next/link"
import { Edit, Star, Tag, Trash, Hotel, Plus, BedDouble, DollarSign } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

interface RoomsListProps {
  rooms: any[]
  hotelId: string
}

export function RoomsList({ rooms: initialRooms, hotelId }: RoomsListProps) {
  const [rooms, setRooms] = useState(initialRooms)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()

  const deleteRoom = async (roomId: string) => {
    if (isDeleting) return

    setIsDeleting(roomId)

    try {
      const response = await fetch(`/api/dashboard/hotels/${hotelId}/rooms/${roomId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete room")
      }

      // Mettre à jour l'état local pour retirer la chambre
      setRooms(rooms.filter((room) => room.id !== roomId))

      toast("Chambre supprimée", {
        description: "La chambre a été supprimée avec succès.",
      })

      // Rafraîchir la page pour mettre à jour les données
      router.refresh()
    } catch (error) {
      console.error("Error deleting room:", error)
      toast("Erreur", {
        description: "Impossible de supprimer la chambre. Veuillez réessayer.",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  // Fonction pour obtenir une couleur aléatoire pour les badges de catégorie
  const getCategoryColor = (category: string) => {
    const colors = ["primary", "secondary", "accent", "default", "destructive"]
    const hash = category.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <Card key={room.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{room.name}</CardTitle>
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="ml-1 text-sm font-medium">{room.rate.toFixed(1)}</span>
              </div>
            </div>
            <CardDescription className="flex items-center text-sm">
              <DollarSign className="mr-1 h-3.5 w-3.5" />
              {room.price.toFixed(2)} par nuit
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{room.content}</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {room.categories?.split(",").map((category: string, i: number) => {
                const trimmedCategory = category.trim()
                if (!trimmedCategory) return null
                return (
                  <Badge key={i} variant="outline" className="text-xs">
                    {trimmedCategory}
                  </Badge>
                )
              })}
            </div>
            {room.tags && (
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <Tag className="mr-1 h-3 w-3" />
                {room.tags}
              </div>
            )}
            {room.types && room.types.length > 0 && (
              <div className="flex items-center mt-2 gap-1">
                <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {room.types.map((type: any) => (
                    <span key={type.typeId} className="text-xs text-muted-foreground">
                      {type.type.name}
                      {room.types.indexOf(type) < room.types.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-3">
            <Link href={`/dashboard/hotels/${hotelId}/rooms/${room.id}`}>
              <Button variant="outline" size="sm">
                Voir détails
              </Button>
            </Link>
            <div className="flex space-x-2">
              <Link href={`/dashboard/hotels/${hotelId}/rooms/${room.id}/edit`}>
                <Button size="sm" variant="ghost">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="text-destructive" disabled={isDeleting === room.id}>
                    {isDeleting === room.id ? <span className="animate-spin">...</span> : <Trash className="h-4 w-4" />}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action ne peut pas être annulée. Cela supprimera définitivement la chambre "{room.name}" et
                      toutes les données associées.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteRoom(room.id)}
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

      {rooms.length === 0 && (
        <Card className="col-span-full p-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Hotel className="h-8 w-8 text-muted-foreground" />
            <h3 className="text-lg font-medium">Aucune chambre trouvée</h3>
            <p className="text-sm text-muted-foreground">
              Cet hôtel ne possède pas encore de chambres. Ajoutez votre première chambre pour commencer.
            </p>
            <Link href={`/dashboard/hotels/${hotelId}/rooms/new`}>
              <Button className="mt-2">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une chambre
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
