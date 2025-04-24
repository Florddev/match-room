import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withServerAuth } from "@/lib/auth-server-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withServerAuth(async (user) => {
    try {
      const userId = user.id;
      const hotelId = params.id;

      // Vérifier que l'hôtel existe et appartient à l'utilisateur
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

      // Récupérer tous les types de chambres
      const types = await prisma.type.findMany();

      return NextResponse.json({ 
        hotel,
        types 
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des types de chambres:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des types de chambres" },
        { status: 500 }
      );
    }
  });
}