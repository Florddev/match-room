import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    // Récupérer les villes avec le plus de chambres
    const popularDestinations = await prisma.hotel.groupBy({
      by: ["city"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 4,
    })

    // Pour chaque ville, récupérer le nombre total de chambres
    const destinationsWithRoomCount = await Promise.all(
      popularDestinations.map(async (destination) => {
        const roomCount = await prisma.room.count({
          where: {
            hotel: {
              city: destination.city,
            },
          },
        })

        // Récupérer une image d'hôtel pour cette ville
        const hotel = await prisma.hotel.findFirst({
          where: {
            city: destination.city,
          },
          /*
          select: {
            image: true,
          },
          */
        })

        return {
          name: destination.city,
          image: /*hotel?.image ||*/ "/hotel.jpg",
          rooms: roomCount,
          hotelCount: destination._count.id,
        }
      }),
    )

    return NextResponse.json(destinationsWithRoomCount)
  } catch (error) {
    console.error("Error fetching popular destinations:", error)
    return NextResponse.json({ error: "Failed to fetch popular destinations" }, { status: 500 })
  }
}
