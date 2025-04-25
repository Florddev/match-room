import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withServerAuth } from '@/lib/auth-server-utils';

// Endpoint pour accepter une contre-offre
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withServerAuth(async (user) => {
    try {
      const negotiationId = params.id;
      
      // Récupérer la négociation
      const negotiation = await prisma.negotiation.findUnique({
        where: { id: negotiationId },
        include: {
          room: true
        }
      });

      if (!negotiation) {
        return NextResponse.json(
          { error: 'Négociation introuvable' },
          { status: 404 }
        );
      }

      // Vérifier que l'utilisateur est le propriétaire de la négociation
      if (negotiation.userId !== user.id) {
        return NextResponse.json(
          { error: 'Vous n\'êtes pas autorisé à accepter cette contre-offre' },
          { status: 403 }
        );
      }

      // Vérifier que le statut est bien "countered"
      if (negotiation.status !== 'countered') {
        return NextResponse.json(
          { error: 'Cette négociation n\'est pas une contre-offre' },
          { status: 400 }
        );
      }

      // Vérifier que la chambre est toujours disponible pour ces dates
      const isAvailable = await checkRoomAvailability(
        negotiation.roomId,
        negotiation.startDate.toISOString(),
        negotiation.endDate.toISOString()
      );
      
      if (!isAvailable) {
        return NextResponse.json(
          { error: 'La chambre n\'est plus disponible pour ces dates' },
          { status: 409 }
        );
      }

      // Mettre à jour le statut de la négociation
      const updatedNegotiation = await prisma.negotiation.update({
        where: { id: negotiationId },
        data: {
          status: 'accepted',
          updatedAt: new Date()
        }
      });

      return NextResponse.json(updatedNegotiation);
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de la contre-offre:', error);
      return NextResponse.json(
        { error: 'Une erreur est survenue lors de l\'acceptation de la contre-offre' },
        { status: 500 }
      );
    }
  });
}

// Fonction utilitaire pour vérifier la disponibilité d'une chambre
async function checkRoomAvailability(roomId: string, startDate: string, endDate: string): Promise<boolean> {
  // Vérifier s'il existe des réservations qui chevauchent la période
  const existingBookings = await prisma.booking.findFirst({
    where: {
      roomId,
      OR: [
        {
          AND: [
            { startDate: { lte: new Date(endDate) } },
            { endDate: { gte: new Date(startDate) } }
          ]
        }
      ]
    }
  });

  // Vérifier s'il existe d'autres négociations acceptées qui chevauchent la période
  const existingNegotiations = await prisma.negotiation.findFirst({
    where: {
      roomId,
      status: 'accepted',
      OR: [
        {
          AND: [
            { startDate: { lte: new Date(endDate) } },
            { endDate: { gte: new Date(startDate) } }
          ]
        }
      ]
    }
  });

  // La chambre est disponible s'il n'y a ni réservation ni négociation acceptée
  return !existingBookings && !existingNegotiations;
}