import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withServerAuth } from '@/lib/auth-server-utils';

// Récupérer les détails d'une négociation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withServerAuth(async (user) => {
    try {
      const negotiationId = params.id;
      
      const negotiation = await prisma.negotiation.findUnique({
        where: { id: negotiationId },
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
          },
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true
            }
          }
        }
      });

      if (!negotiation) {
        return NextResponse.json(
          { error: 'Négociation introuvable' },
          { status: 404 }
        );
      }

      // Vérifier que l'utilisateur est autorisé à voir cette négociation
      // (soit c'est sa négociation, soit il est le gestionnaire de l'hôtel)
      const isClient = negotiation.userId === user.id;
      
      // Vérifier si l'utilisateur est gestionnaire de l'hôtel
      const isHotelManager = await prisma.usersHotels.findFirst({
        where: {
          userId: user.id,
          hotelId: negotiation.room.hotelId
        }
      });

      if (!isClient && !isHotelManager) {
        return NextResponse.json(
          { error: 'Vous n\'êtes pas autorisé à accéder à cette négociation' },
          { status: 403 }
        );
      }

      return NextResponse.json(negotiation);
    } catch (error) {
      console.error('Erreur lors de la récupération de la négociation:', error);
      return NextResponse.json(
        { error: 'Une erreur est survenue lors de la récupération de la négociation' },
        { status: 500 }
      );
    }
  });
}

// Mettre à jour le statut d'une négociation (accepter, refuser, contre-offre)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withServerAuth(async (user) => {
    try {
      const negotiationId = params.id;
      const { status, counterPrice } = await request.json();
      
      if (!['accepted', 'rejected', 'countered'].includes(status)) {
        return NextResponse.json(
          { error: 'Statut invalide' },
          { status: 400 }
        );
      }

      // Récupérer la négociation avec les informations sur la chambre et l'hôtel
      const negotiation = await prisma.negotiation.findUnique({
        where: { id: negotiationId },
        include: {
          room: {
            include: { hotel: true }
          }
        }
      });

      if (!negotiation) {
        return NextResponse.json(
          { error: 'Négociation introuvable' },
          { status: 404 }
        );
      }

      // Vérifier que l'utilisateur est gestionnaire de l'hôtel
      const isHotelManager = await prisma.usersHotels.findFirst({
        where: {
          userId: user.id,
          hotelId: negotiation.room.hotelId
        }
      });

      if (!isHotelManager) {
        return NextResponse.json(
          { error: 'Vous n\'êtes pas autorisé à gérer cette négociation' },
          { status: 403 }
        );
      }

      // Si le statut est "countered", vérifier que counterPrice est fourni
      if (status === 'countered' && !counterPrice) {
        return NextResponse.json(
          { error: 'Un prix de contre-offre est requis' },
          { status: 400 }
        );
      }

      // Si la négociation est acceptée, vérifier que la chambre est toujours disponible
      if (status === 'accepted') {
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
      }

      // Mettre à jour la négociation
      const updatedNegotiation = await prisma.negotiation.update({
        where: { id: negotiationId },
        data: {
          status,
          price: status === 'countered' ? parseFloat(counterPrice.toString()) : negotiation.price,
          updatedAt: new Date()
        }
      });

      // Si la négociation est acceptée, créer une réservation
      if (status === 'accepted') {
        await prisma.booking.create({
          data: {
            roomId: negotiation.roomId,
            userId: negotiation.userId,
            startDate: negotiation.startDate,
            endDate: negotiation.endDate,
            price: negotiation.price
          }
        });
      }

      return NextResponse.json(updatedNegotiation);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la négociation:', error);
      return NextResponse.json(
        { error: 'Une erreur est survenue lors de la mise à jour de la négociation' },
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

// Annuler une négociation (pour l'utilisateur)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withServerAuth(async (user) => {
    try {
      const negotiationId = params.id;
      
      // Récupérer la négociation
      const negotiation = await prisma.negotiation.findUnique({
        where: { id: negotiationId }
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
          { error: 'Vous n\'êtes pas autorisé à annuler cette négociation' },
          { status: 403 }
        );
      }

      // Vérifier que la négociation n'est pas déjà acceptée
      if (negotiation.status === 'accepted') {
        return NextResponse.json(
          { error: 'Impossible d\'annuler une négociation déjà acceptée' },
          { status: 400 }
        );
      }

      // Mettre à jour le statut de la négociation à "cancelled"
      await prisma.negotiation.update({
        where: { id: negotiationId },
        data: { status: 'cancelled' }
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la négociation:', error);
      return NextResponse.json(
        { error: 'Une erreur est survenue lors de l\'annulation de la négociation' },
        { status: 500 }
      );
    }
  });
}