import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { withServerAuth } from "@/lib/auth-server-utils"

export async function GET(request: NextRequest) {
  return withServerAuth(async (user) => {
    try {
      const userId = user.id

      // Récupérer les hôtels de l'utilisateur avec leurs chambres
      const userHotels = await prisma.hotel.findMany({
        where: {
          users: {
            some: {
              userId: userId,
            },
          },
        },
        include: {
          rooms: true,
        },
      })

      // Calculer les statistiques globales
      const totalHotels = userHotels.length
      const allRooms = userHotels.flatMap((hotel) => hotel.rooms)
      const totalRooms = allRooms.length

      // Calculer le prix moyen et la note moyenne
      const averagePrice = totalRooms > 0 ? allRooms.reduce((sum, room) => sum + room.price, 0) / totalRooms : 0

      const averageRating = totalRooms > 0 ? allRooms.reduce((sum, room) => sum + room.rate, 0) / totalRooms : 0

      // Récupérer les réservations récentes (simulées pour l'instant)
      const recentBookings = [
        {
          id: "1",
          guestName: "Jean Dupont",
          hotelName: "Hôtel de Paris",
          roomName: "Suite Deluxe",
          checkIn: new Date(Date.now() + 86400000 * 2).toISOString(),
          checkOut: new Date(Date.now() + 86400000 * 5).toISOString(),
          status: "confirmed",
          amount: 450.0,
        },
        {
          id: "2",
          guestName: "Marie Martin",
          hotelName: "Grand Hôtel",
          roomName: "Chambre Double",
          checkIn: new Date(Date.now() + 86400000 * 7).toISOString(),
          checkOut: new Date(Date.now() + 86400000 * 10).toISOString(),
          status: "pending",
          amount: 320.0,
        },
        {
          id: "3",
          guestName: "Pierre Durand",
          hotelName: "Résidence du Lac",
          roomName: "Suite Familiale",
          checkIn: new Date(Date.now() + 86400000 * 14).toISOString(),
          checkOut: new Date(Date.now() + 86400000 * 21).toISOString(),
          status: "confirmed",
          amount: 980.0,
        },
      ]

      // Préparer les données des hôtels pour l'affichage
      const topHotels = userHotels
        .map((hotel) => {
          const roomCount = hotel.rooms.length
          const hotelAveragePrice =
            roomCount > 0 ? hotel.rooms.reduce((sum, room) => sum + room.price, 0) / roomCount : 0

          return {
            id: hotel.id,
            name: hotel.name,
            roomCount,
            averagePrice: hotelAveragePrice,
            rating: hotel.rate,
          }
        })
        .sort((a, b) => b.roomCount - a.roomCount)

      // Générer des statistiques mensuelles (simulées pour l'instant)
      const currentMonth = new Date().getMonth()
      const monthlyStats = Array.from({ length: 6 }, (_, i) => {
        const monthIndex = (currentMonth - i + 12) % 12
        const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]

        return {
          month: monthNames[monthIndex],
          bookings: Math.floor(Math.random() * 50) + 10,
          revenue: Math.floor(Math.random() * 10000) + 2000,
        }
      }).reverse()

      return NextResponse.json({
        totalHotels,
        totalRooms,
        averagePrice,
        averageRating,
        recentBookings,
        topHotels,
        monthlyStats,
      })
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques du tableau de bord:", error)
      return NextResponse.json(
        { error: "Erreur lors de la récupération des statistiques du tableau de bord" },
        { status: 500 },
      )
    }
  })
}
