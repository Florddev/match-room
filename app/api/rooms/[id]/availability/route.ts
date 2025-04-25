import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Les dates de début et de fin sont requises' },
        { status: 400 }
      );
    }

    // Vérifier l'existence de la chambre
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Chambre introuvable' },
        { status: 404 }
      );
    }

    // Rechercher des réservations existantes qui chevauchent la période demandée
    const existingBookings = await prisma.booking.findMany({
      where: {
        roomId,
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(startDate) } },
              { endDate: { gte: new Date(startDate) } }
            ]
          },
          {
            AND: [
              { startDate: { lte: new Date(endDate) } },
              { endDate: { gte: new Date(endDate) } }
            ]
          },
          {
            AND: [
              { startDate: { gte: new Date(startDate) } },
              { endDate: { lte: new Date(endDate) } }
            ]
          }
        ]
      }
    });

    // Rechercher aussi des négociations en cours avec statut "accepted"
    const existingNegotiations = await prisma.negotiation.findMany({
      where: {
        roomId,
        status: "accepted",
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(startDate) } },
              { endDate: { gte: new Date(startDate) } }
            ]
          },
          {
            AND: [
              { startDate: { lte: new Date(endDate) } },
              { endDate: { gte: new Date(endDate) } }
            ]
          },
          {
            AND: [
              { startDate: { gte: new Date(startDate) } },
              { endDate: { lte: new Date(endDate) } }
            ]
          }
        ]
      }
    });

    const isAvailable = existingBookings.length === 0 && existingNegotiations.length === 0;

    return NextResponse.json({
      available: isAvailable,
      conflictingBookings: existingBookings.length,
      conflictingNegotiations: existingNegotiations.length
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de disponibilité:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la vérification de disponibilité' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}