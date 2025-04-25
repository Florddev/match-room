import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { withManagerAuth } from "@/lib/auth-server-utils"
import { z } from "zod"

// Schéma de validation pour la mise à jour d'un hôtel
const hotelUpdateSchema = z.object({
  name: z.string().min(2),
  rate: z.number().min(0).max(5),
  address: z.string().min(5),
  city: z.string().min(2),
  zipCode: z.string().min(3),
  phone: z.string().min(5),
})

// Méthode GET pour récupérer un hôtel spécifique avec toutes ses données associées
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withManagerAuth(async (user) => {
    try {
      const userId = user.id
      const hotelId = params.id

      // Récupérer les détails complets de l'hôtel avec toutes les relations
      const hotel = await prisma.hotel.findFirst({
        where: {
          id: hotelId,
          users: {
            some: {
              userId: userId,
            },
          },
        },
        include: {
          // Inclure les utilisateurs associés à cet hôtel
          users: {
            include: {
              user: {
                include: {
                  role: true,
                },
              },
            },
          },
          // Inclure toutes les chambres avec leurs types
          rooms: {
            include: {
              types: {
                include: {
                  type: true,
                },
              },
              // Inclure les réservations pour chaque chambre
              bookings: {
                include: {
                  user: true,
                },
              },
              // Inclure les négociations pour chaque chambre
              negotiations: {
                include: {
                  user: true,
                },
              },
            },
          },
          // Compter le nombre de chambres, réservations et négociations
          _count: {
            select: {
              rooms: true,
            },
          },
        },
      })

      if (!hotel) {
        return NextResponse.json(
          { error: "Hôtel non trouvé ou vous n'avez pas l'autorisation d'y accéder" },
          { status: 404 },
        )
      }

      // Calculer des statistiques supplémentaires
      const totalRooms = hotel._count.rooms

      // Calculer le nombre total de réservations
      let totalBookings = 0
      hotel.rooms.forEach((room) => {
        totalBookings += room.bookings.length
      })

      // Calculer le nombre total de négociations
      let totalNegotiations = 0
      hotel.rooms.forEach((room) => {
        totalNegotiations += room.negotiations.length
      })

      // Calculer le prix moyen des chambres
      const averagePrice =
        hotel.rooms.length > 0 ? hotel.rooms.reduce((sum, room) => sum + room.price, 0) / hotel.rooms.length : 0

      // Calculer la note moyenne des chambres
      const averageRoomRate =
        hotel.rooms.length > 0 ? hotel.rooms.reduce((sum, room) => sum + room.rate, 0) / hotel.rooms.length : 0

      // Extraire toutes les catégories uniques
      const categories = new Set<string>()
      hotel.rooms.forEach((room) => {
        if (room.categories) {
          room.categories.split(",").forEach((category) => {
            categories.add(category.trim())
          })
        }
      })

      // Extraire tous les tags uniques
      const tags = new Set<string>()
      hotel.rooms.forEach((room) => {
        if (room.tags) {
          room.tags.split(",").forEach((tag) => {
            tags.add(tag.trim())
          })
        }
      })

      // Extraire tous les types de chambres uniques
      const roomTypes = new Set<string>()
      hotel.rooms.forEach((room) => {
        room.types.forEach((typeRelation) => {
          roomTypes.add(typeRelation.type.name)
        })
      })

      // Retourner l'hôtel avec les statistiques calculées
      return NextResponse.json({
        hotel,
        stats: {
          totalRooms,
          totalBookings,
          totalNegotiations,
          averagePrice,
          averageRoomRate,
          categories: Array.from(categories),
          tags: Array.from(tags),
          roomTypes: Array.from(roomTypes),
        },
      })
    } catch (error) {
      console.error("Erreur lors de la récupération des détails de l'hôtel:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des détails de l'hôtel" }, { status: 500 })
    }
  })
}

// Méthode PUT pour mettre à jour un hôtel
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withManagerAuth(async (user) => {
    try {
      const userId = user.id
      const hotelId = params.id

      // Récupérer les données du corps de la requête
      const body = await request.json()

      // Valider les données reçues
      const validationResult = hotelUpdateSchema.safeParse(body)

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Données invalides", details: validationResult.error.format() },
          { status: 400 },
        )
      }

      // Vérifier que l'hôtel existe et appartient à l'utilisateur
      const hotelExists = await prisma.hotel.findFirst({
        where: {
          id: hotelId,
          users: {
            some: {
              userId: userId,
            },
          },
        },
      })

      if (!hotelExists) {
        return NextResponse.json(
          { error: "Hôtel non trouvé ou vous n'avez pas l'autorisation de le modifier" },
          { status: 404 },
        )
      }

      const hotelData = validationResult.data

      // Mettre à jour l'hôtel
      const updatedHotel = await prisma.hotel.update({
        where: {
          id: hotelId,
        },
        data: {
          name: hotelData.name,
          rate: hotelData.rate,
          address: hotelData.address,
          city: hotelData.city,
          zipCode: hotelData.zipCode,
          phone: hotelData.phone,
        },
      })

      return NextResponse.json({ hotel: updatedHotel })
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'hôtel:", error)
      return NextResponse.json({ error: "Erreur lors de la mise à jour de l'hôtel" }, { status: 500 })
    }
  })
}

// Méthode DELETE pour supprimer un hôtel
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withManagerAuth(async (user) => {
    try {
      const userId = user.id
      const hotelId = params.id

      // Vérifier que l'hôtel existe et appartient à l'utilisateur
      const hotelExists = await prisma.hotel.findFirst({
        where: {
          id: hotelId,
          users: {
            some: {
              userId: userId,
            },
          },
        },
      })

      if (!hotelExists) {
        return NextResponse.json(
          { error: "Hôtel non trouvé ou vous n'avez pas l'autorisation de le supprimer" },
          { status: 404 },
        )
      }

      // Supprimer l'hôtel
      await prisma.hotel.delete({
        where: {
          id: hotelId,
        },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Erreur lors de la suppression de l'hôtel:", error)
      return NextResponse.json({ error: "Erreur lors de la suppression de l'hôtel" }, { status: 500 })
    }
  })
}
