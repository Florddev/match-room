import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withServerAuth } from "@/lib/auth-server-utils";

// Endpoint pour récupérer les détails d'une réservation spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withServerAuth(async (user) => {
    try {
      const userId = user.id;
      const bookingId = params.id;
      
      // Récupérer la réservation avec les détails de la chambre et de l'hôtel
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          userId: userId // S'assurer que la réservation appartient à l'utilisateur
        },
        include: {
          room: {
            include: {
              hotel: true,
              types: {
                include: {
                  type: true
                }
              }
            }
          }
        }
      });
      
      if (!booking) {
        return NextResponse.json(
          { error: "Réservation non trouvée ou vous n'êtes pas autorisé à y accéder" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ booking });
    } catch (error) {
      console.error("Erreur lors de la récupération des détails de la réservation:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des détails de la réservation" },
        { status: 500 }
      );
    }
  });
}

// Endpoint pour annuler une réservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withServerAuth(async (user) => {
    try {
      const userId = user.id;
      const bookingId = params.id;
      
      // Vérifier que la réservation existe et appartient à l'utilisateur
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          userId: userId
        }
      });
      
      if (!booking) {
        return NextResponse.json(
          { error: "Réservation non trouvée ou vous n'êtes pas autorisé à y accéder" },
          { status: 404 }
        );
      }
      
      // Vérifier si l'annulation est possible (par exemple, pas trop proche de la date de début)
      const today = new Date();
      const startDate = new Date(booking.startDate);
      const daysDifference = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Si la réservation commence dans moins de 48 heures, l'annulation n'est pas possible
      if (daysDifference < 2) {
        return NextResponse.json(
          { error: "L'annulation n'est pas possible à moins de 48 heures du début du séjour" },
          { status: 400 }
        );
      }
      
      // Supprimer la réservation
      await prisma.booking.delete({
        where: {
          id: bookingId
        }
      });
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Erreur lors de l'annulation de la réservation:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'annulation de la réservation" },
        { status: 500 }
      );
    }
  });
}