import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const hotelId = params.id

    // Récupérer l'hôtel avec toutes ses relations
    const hotel = await prisma.hotel.findUnique({
      where: {
        id: hotelId,
      },
      include: {
        rooms: {
          include: {
            types: {
              include: {
                type: true,
              },
            },
            bookings: {
              select: {
                startDate: true,
                endDate: true,
              },
            },
            negotiations: {
              select: {
                status: true,
                price: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        },
      },
    })

    if (!hotel) {
      return NextResponse.json({ error: "Hôtel non trouvé" }, { status: 404 })
    }

    // Calculer des statistiques supplémentaires
    const enhancedHotel = {
      ...hotel,
      roomCount: hotel.rooms.length,
      minPrice: hotel.rooms.length > 0 ? Math.min(...hotel.rooms.map((room) => room.price)) : 0,
      maxPrice: hotel.rooms.length > 0 ? Math.max(...hotel.rooms.map((room) => room.price)) : 0,
      averageRoomRate:
        hotel.rooms.length > 0 ? hotel.rooms.reduce((sum, room) => sum + room.rate, 0) / hotel.rooms.length : 0,
      roomTypes: [...new Set(hotel.rooms.flatMap((room) => room.types.map((type) => type.type.name)))],
      roomCategories: [...new Set(hotel.rooms.flatMap((room) => room.categories.split(",").map((cat) => cat.trim())))],
      roomTags: [...new Set(hotel.rooms.flatMap((room) => room.tags.split(",").map((tag) => tag.trim())))],
    }

    return NextResponse.json(enhancedHotel)
  } catch (error) {
    console.error("Erreur lors de la récupération des détails de l'hôtel:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des détails de l'hôtel" }, { status: 500 })
  }
}
