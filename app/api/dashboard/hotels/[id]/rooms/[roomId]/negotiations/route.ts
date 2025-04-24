import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withServerAuth } from "@/lib/auth-server-utils";

// Récupérer toutes les négociations pour une chambre spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string } }
) {
  return withServerAuth(async (user) => {
    try {
      const userId = user.id;
      const hotelId = params.id;
      const roomId = params.roomId;

      // Vérifier que l'hôtel appartient à l'utilisateur
      const hotel = await prisma.hotel.findFirst({
        where: {
          id: hotelId,
          users: {
            some: {
              userId: userId,
            },
          },
        },
      });

      if (!hotel) {
        return NextResponse.json(
          { error: "Hôtel non trouvé ou vous n'avez pas l'autorisation d'y accéder" },
          { status: 404 }
        );
      }

      // Vérifier que la chambre appartient à l'hôtel
      const room = await prisma.room.findFirst({
        where: {
          id: roomId,
          hotelId: hotelId,
        },
      });

      if (!room) {
        return NextResponse.json(
          { error: "Chambre non trouvée ou vous n'avez pas l'autorisation d'y accéder" },
          { status: 404 }
        );
      }

      // Récupérer toutes les négociations pour cette chambre
      const negotiations = await prisma.negotiation.findMany({
        where: {
          roomId: roomId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return NextResponse.json({ negotiations });
    } catch (error) {
      console.error("Erreur lors de la récupération des négociations:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des négociations" },
        { status: 500 }
      );
    }
  });
}