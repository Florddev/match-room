import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withServerAuth } from "@/lib/auth-server-utils";
import { z } from "zod";

// Schéma de validation pour la création d'une chambre
const roomSchema = z.object({
  name: z.string().min(2),
  content: z.string().optional(),
  tags: z.string().optional(),
  categories: z.string().optional(),
  price: z.number().min(0),
  rate: z.number().min(0).max(5),
  /*maxOccupancy: z.number().min(1),*/
  typeIds: z.array(z.string()).optional(),
});

// Méthode POST pour créer une nouvelle chambre
export async function POST(
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
      
      // Récupérer les données du corps de la requête
      const body = await request.json();
      
      // Valider les données reçues
      const validationResult = roomSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Données invalides", details: validationResult.error.format() },
          { status: 400 }
        );
      }
      
      const roomData = validationResult.data;
      const typeIds = roomData.typeIds || [];
      
      // Créer la chambre dans la base de données
      const newRoom = await prisma.room.create({
        data: {
          name: roomData.name,
          price: roomData.price,
          rate: roomData.rate,
          content: roomData.content ?? '',
          categories: roomData.categories ?? '',
          tags: roomData.tags ?? '',
          /*maxOccupancy: roomData.maxOccupancy,*/
          hotelId: hotelId,
          // Associer les types de chambre
          types: {
            create: typeIds.map(typeId => ({
              typeId: typeId
            }))
          }
        },
        include: {
          types: {
            include: {
              type: true
            }
          }
        }
      });
      
      return NextResponse.json({ room: newRoom }, { status: 201 });
    } catch (error) {
      console.error("Erreur lors de la création de la chambre:", error);
      return NextResponse.json(
        { error: "Erreur lors de la création de la chambre" },
        { status: 500 }
      );
    }
  });
}