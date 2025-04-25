import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    // Récupérer les types de chambres avec le nombre de chambres pour chaque type
    const roomTypes = await prisma.room.groupBy({
      by: ["type"],
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

    // Pour chaque type, récupérer une image représentative
    const roomTypesWithImage = await Promise.all(
      roomTypes.map(async (type) => {
        // Récupérer une image pour ce type de chambre
        const room = await prisma.room.findFirst({
          where: {
            type: type.type,
          },
          select: {
            image: true,
          },
        })

        // Formater le nom du type pour l'affichage
        let displayName = type.type
        if (displayName === "standard") displayName = "Chambres standard"
        else if (displayName === "deluxe") displayName = "Chambres de luxe"
        else if (displayName === "suite") displayName = "Suites"
        else if (displayName === "family") displayName = "Chambres familiales"
        else if (displayName === "economy") displayName = "Chambres économiques"
        else displayName = `Chambres ${displayName}`

        return {
          name: displayName,
          type: type.type,
          image: room?.image || "/hotel.jpg",
          count: type._count.id,
        }
      }),
    )

    return NextResponse.json(roomTypesWithImage)
  } catch (error) {
    console.error("Error fetching room types:", error)
    return NextResponse.json({ error: "Failed to fetch room types" }, { status: 500 })
  }
}
