import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon } from "lucide-react"

interface Booking {
  id: string
  guestName: string
  hotelName: string
  roomName: string
  checkIn: string
  checkOut: string
  status: "confirmed" | "pending" | "cancelled"
  amount: number
}

interface RecentBookingsProps {
  bookings: Booking[]
}

export function RecentBookings({ bookings }: RecentBookingsProps) {
  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    })
  }

  // Fonction pour obtenir les initiales d'un nom
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Fonction pour obtenir la couleur du badge en fonction du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "success"
      case "pending":
        return "warning"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  // Fonction pour traduire le statut
  const translateStatus = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmée"
      case "pending":
        return "En attente"
      case "cancelled":
        return "Annulée"
      default:
        return status
    }
  }

  return (
    <div className="space-y-8">
      {bookings.length > 0 ? (
        bookings.map((booking) => (
          <div key={booking.id} className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{getInitials(booking.guestName)}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{booking.guestName}</p>
              <p className="text-sm text-muted-foreground">
                {booking.hotelName} • {booking.roomName}
              </p>
            </div>
            <div className="ml-auto flex flex-col items-end gap-1">
              <Badge variant={getStatusColor(booking.status) as any}>{translateStatus(booking.status)}</Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarIcon className="h-3 w-3" />
                <span>
                  {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                </span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="flex h-[200px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-medium">Aucune réservation récente</p>
            <p className="text-sm text-muted-foreground">Les réservations apparaîtront ici une fois effectuées</p>
          </div>
        </div>
      )}
    </div>
  )
}
