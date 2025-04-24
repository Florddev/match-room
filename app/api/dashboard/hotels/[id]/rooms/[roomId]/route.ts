import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withServerAuth } from "@/lib/auth-server-utils";
import { z } from "zod";

// Schéma de validation pour la mise à jour d'une chambre
const roomUpdateSchema = z.object({
  name: z.string().min(2),
  content: z.string().optional(),
  price: z.number().min(0),
  rate: z.number().min(0).max(5),
  /*maxOccupancy: z.number().min(1),*/
  typeIds: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string } }
) {
  return withServerAuth(async (user) => {
    try {
      const userId = user.id;
      const hotelId = params.id;
      const roomId = params.roomId;

      const room = await prisma.room.findFirst({
        where: {
          id: roomId,
          hotelId: hotelId,
          hotel: {
            users: {
              some: {
                userId: userId,
              },
            },
          },
        },
        include: {
          types: {
            include: {
              type: true,
            },
          },
          hotel: true,
        },
      });

      if (!room) {
        return NextResponse.json(
          { error: "Chambre non trouvée ou vous n'avez pas l'autorisation d'y accéder" },
          { status: 404 }
        );
      }

      return NextResponse.json({ room });
    } catch (error) {
      console.error("Erreur lors de la récupération des détails de la chambre:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des détails de la chambre" },
        { status: 500 }
      );
    }
  });
}

// Méthode PUT pour mettre à jour une chambre
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string } }
) {
  return withServerAuth(async (user) => {
    try {
      const userId = user.id;
      const hotelId = params.id;
      const roomId = params.roomId;
      
      // Vérifier que la chambre existe et appartient à un hôtel de l'utilisateur
      const roomExists = await prisma.room.findFirst({
        where: {
          id: roomId,
          hotelId: hotelId,
          hotel: {
            users: {
              some: {
                userId: userId,
              },
            },
          },
        },
      });

      if (!roomExists) {
        return NextResponse.json(
          { error: "Chambre non trouvée ou vous n'avez pas l'autorisation de la modifier: " + roomId  },
          { status: 404 }
        );
      }
      
      // Récupérer les données du corps de la requête
      const body = await request.json();
      
      // Valider les données reçues
      const validationResult = roomUpdateSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Données invalides", details: validationResult.error.format() },
          { status: 400 }
        );
      }
      
      const roomData = validationResult.data;
      const typeIds = roomData.typeIds || [];
      
      // Mettre à jour la chambre dans la base de données
      
      await prisma.roomsTypes.deleteMany({
        where: {
          roomId: roomId,
        },
      });
      
      const updatedRoom = await prisma.room.update({
        where: {
          id: roomId,
        },
        data: {
          name: roomData.name,
          content: roomData.content || '',
          price: roomData.price,
          rate: roomData.rate,
          /*maxOccupancy: roomData.maxOccupancy,*/
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
      
      return NextResponse.json({ room: updatedRoom });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la chambre:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour de la chambre" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string } }
) {
  return withServerAuth(async (user) => {
    try {
      const userId = user.id;
      const hotelId = params.id;
      const roomId = params.roomId;
      
      const roomExists = await prisma.room.findFirst({
        where: {
          id: roomId,
          hotelId: hotelId,
          hotel: {
            users: {
              some: {
                userId: userId,
              },
            },
          },
        },
      });

      if (!roomExists) {
        return NextResponse.json(
          { error: "Chambre non trouvée ou vous n'avez pas l'autorisation de la supprimer" },
          { status: 404 }
        );
      }
      
      await prisma.roomsTypes.deleteMany({
        where: {
          roomId: roomId,
        },
      });
      
      await prisma.room.delete({
        where: {
          id: roomId,
        },
      });
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Erreur lors de la suppression de la chambre:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression de la chambre" },
        { status: 500 }
      );
    }
  });
}