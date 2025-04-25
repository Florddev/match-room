import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withServerAuth } from '@/lib/auth-server-utils';

// Créer une nouvelle négociation
export async function POST(request: NextRequest) {
  return withServerAuth(async (user) => {
    try {
      const { roomId, price, startDate, endDate } = await request.json();

      // Validation des données
      if (!roomId || !price || !startDate || !endDate) {
        return NextResponse.json(
          { error: 'Tous les champs sont requis' },
          { status: 400 }
        );
      }

      // Vérifier que la chambre existe
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { hotel: true }
      });

      if (!room) {
        return NextResponse.json(
          { error: 'Chambre introuvable' },
          { status: 404 }
        );
      }

      // Vérifier la disponibilité pour ces dates
      const isAvailable = await checkRoomAvailability(roomId, startDate, endDate);
      
      if (!isAvailable) {
        return NextResponse.json(
          { error: 'La chambre n\'est pas disponible pour ces dates' },
          { status: 409 }
        );
      }

      // Vérifier si une négociation existe déjà pour cet utilisateur, cette chambre et ces dates
      const existingNegotiation = await prisma.negotiation.findFirst({
        where: {
          userId: user.id,
          roomId,
          status: { in: ['pending', 'countered'] },
          AND: [
            { startDate: { lte: new Date(endDate) } },
            { endDate: { gte: new Date(startDate) } }
          ]
        }
      });

      if (existingNegotiation) {
        return NextResponse.json(
          { error: 'Vous avez déjà une négociation en cours pour cette chambre et ces dates' },
          { status: 409 }
        );
      }

      // Créer la négociation
      const negotiation = await prisma.negotiation.create({
        data: {
          userId: user.id,
          roomId,
          price: parseFloat(price.toString()),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: 'pending' // statut initial: en attente
        },
        include: {
          room: {
            include: { hotel: true }
          },
          user: true
        }
      });

      return NextResponse.json(negotiation, { status: 201 });
    } catch (error) {
      console.error('Erreur lors de la création de la négociation:', error);
      return NextResponse.json(
        { error: 'Une erreur est survenue lors de la création de la négociation' },
        { status: 500 }
      );
    }
  });
}

// Récupérer les négociations de l'utilisateur
export async function GET(request: NextRequest) {
  return withServerAuth(async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      
      let whereClause: any = { userId: user.id };
      
      // Filtrer par statut si spécifié
      if (status) {
        whereClause.status = status;
      }

      const negotiations = await prisma.negotiation.findMany({
        where: whereClause,
        include: {
          room: {
            include: {
              hotel: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return NextResponse.json(negotiations);
    } catch (error) {
      console.error('Erreur lors de la récupération des négociations:', error);
      return NextResponse.json(
        { error: 'Une erreur est survenue lors de la récupération des négociations' },
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

  // Vérifier s'il existe des négociations acceptées qui chevauchent la période
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