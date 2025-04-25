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
      const bookingId = params.id;
      
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          userId: userId 
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withServerAuth(async (user) => {
    try {
      const userId = user.id;
      const bookingId = params.id;

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
    
      if (booking.status === 'PAID') {
        return NextResponse.json(
          { error: "Vous devez contacter le support pour annuler une réservation déjà payée" },
          { status: 400 }
        );
      }
     
      const today = new Date();
      const startDate = new Date(booking.startDate);
      const daysDifference = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
     
      if (daysDifference < 2) {
        return NextResponse.json(
          { error: "L'annulation n'est pas possible à moins de 48 heures du début du séjour" },
          { status: 400 }
        );
      }
     
      const updatedBooking = await prisma.booking.update({
        where: {
          id: bookingId
        },
        data: {
          status: 'CANCELLED'
        }
      });
     
      return NextResponse.json({ 
        success: true,
        booking: updatedBooking 
      });

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