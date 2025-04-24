import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withServerAuth } from "@/lib/auth-server-utils";
import { z } from "zod";

// Schéma pour la validation des actions de négociation
const negotiationActionSchema = z.object({
  action: z.enum(["accept", "reject", "counter"]),
  price: z.number().optional(),
  message: z.string().optional(),
});

// Endpoint pour gérer les actions sur une négociation spécifique
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string; negoId: string } }
) {
  return withServerAuth(async (user) => {
    try {
      const userId = user.id;
      const hotelId = params.id;
      const roomId = params.roomId;
      const negotiationId = params.negoId;

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

      // Vérifier que la négociation existe et est liée à cette chambre
      const negotiation = await prisma.negotiation.findFirst({
        where: {
          id: negotiationId,
          roomId: roomId,
        },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!negotiation) {
        return NextResponse.json(
          { error: "Négociation non trouvée" },
          { status: 404 }
        );
      }

      // Vérifier que la négociation est en attente (status="pending") ou contre-proposition (status="counter")
      if (negotiation.status.toLocaleLowerCase() !== "pending" && negotiation.status.toLocaleLowerCase() !== "counter") {
        return NextResponse.json(
          { error: "Cette négociation n'est plus active" },
          { status: 400 }
        );
      }

      // Récupérer et valider les données de la requête
      const body = await request.json();
      const validationResult = negotiationActionSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Données invalides", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { action, price, message } = validationResult.data;

      // Traiter l'action en fonction de sa valeur
      switch (action) {
        case "accept":
          // Accepter la négociation
          const acceptedNegotiation = await prisma.negotiation.update({
            where: {
              id: negotiationId,
            },
            data: {
              status: "accepted",
            },
          });

          // Ici, vous pourriez créer automatiquement une réservation
          // ou envoyer un email au client pour l'informer que sa négociation a été acceptée

          return NextResponse.json({ negotiation: acceptedNegotiation });

        case "reject":
          // Rejeter la négociation
          const rejectedNegotiation = await prisma.negotiation.update({
            where: {
              id: negotiationId,
            },
            data: {
              status: "rejected",
              // Vous pouvez ajouter le message de rejet si nécessaire
            },
          });

          return NextResponse.json({ negotiation: rejectedNegotiation });

        case "counter":
          // Faire une contre-proposition
          if (!price) {
            return NextResponse.json(
              { error: "Le prix est requis pour une contre-proposition" },
              { status: 400 }
            );
          }

          const counterNegotiation = await prisma.negotiation.update({
            where: {
              id: negotiationId,
            },
            data: {
              status: "counter",
              price: price,
              // Vous pouvez ajouter un champ pour stocker le message si nécessaire
            },
          });

          return NextResponse.json({ negotiation: counterNegotiation });

        default:
          return NextResponse.json(
            { error: "Action non reconnue" },
            { status: 400 }
          );
      }
    } catch (error) {
      console.error("Erreur lors du traitement de l'action de négociation:", error);
      return NextResponse.json(
        { error: "Erreur lors du traitement de l'action de négociation" },
        { status: 500 }
      );
    }
  });
}