import { withManagerAuth } from "@/lib/auth-server-utils"
import prisma from "@/lib/prisma"

export async function GET() {
  return withManagerAuth(async (user) => {
    try {
      // Récupérer les statistiques globales
      const totalHotels = await prisma.hotel.count()
      const totalRooms = await prisma.room.count()
      const totalBookings = await prisma.booking.count()
      const totalNegotiations = await prisma.negotiation.count()

      // Récupérer les réservations récentes
      const recentBookings = await prisma.booking.findMany({
        take: 5,
        orderBy: {
          startDate: "desc",
        },
        include: {
          room: {
            include: {
              hotel: true,
            },
          },
          user: true,
        },
      })

      // Récupérer les négociations récentes
      const recentNegotiations = await prisma.negotiation.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          room: {
            include: {
              hotel: true,
            },
          },
          user: true,
        },
      })

      return Response.json({
        stats: {
          totalHotels,
          totalRooms,
          totalBookings,
          totalNegotiations,
        },
        recentBookings,
        recentNegotiations,
      })
    } catch (error) {
      console.error("Erreur lors de la récupération des données du dashboard:", error)
      return Response.json({ error: "Erreur lors de la récupération des données" }, { status: 500 })
    }
  })
}
