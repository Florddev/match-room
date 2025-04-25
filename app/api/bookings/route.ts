import { NextRequest, NextResponse } from 'next/server';
import { withServerAuth } from '@/lib/auth-server-utils';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    return withServerAuth(async (user) => {
        try {
            // Récupérer les données de la requête
            const data = await request.json();
            const { roomId, startDate, endDate, price } = data;

            // Validation des données
            if (!roomId || !startDate || !endDate || !price) {
                return NextResponse.json({ error: 'Données de réservation incomplètes' }, { status: 400 });
            }

            // Vérifier que la chambre existe
            const room = await prisma.room.findUnique({
                where: { id: roomId }
            });

            if (!room) {
                return NextResponse.json({ error: 'Chambre introuvable' }, { status: 404 });
            }

            // Vérifier la disponibilité (aucune réservation existante pour cette période)
            const existingBooking = await prisma.booking.findFirst({
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

            if (existingBooking) {
                return NextResponse.json({ error: 'La chambre n\'est pas disponible pour ces dates' }, { status: 409 });
            }

            // Créer la réservation
            const booking = await prisma.booking.create({
                data: {
                    roomId,
                    userId: user.id,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    price: parseFloat(price.toString()),
                }
            });

            return NextResponse.json(booking, { status: 201 });
        } catch (error) {
            console.error('Erreur lors de la création de la réservation:', error);
            return NextResponse.json({ error: 'Une erreur est survenue lors de la création de la réservation' }, { status: 500 });
        } finally {
            await prisma.$disconnect();
        }
    })
}

// Récupérer les réservations de l'utilisateur connecté
export async function GET(request: NextRequest) {
    return withServerAuth(async (user) => {
        try {
            const bookings = await prisma.booking.findMany({
                where: {
                    userId: user.id
                },
                include: {
                    room: {
                        include: {
                            hotel: true
                        }
                    }
                },
                orderBy: {
                    startDate: 'desc'
                }
            });

            return NextResponse.json(bookings);
        } catch (error) {
            console.error('Erreur lors de la récupération des réservations:', error);
            return NextResponse.json({ error: 'Une erreur est survenue lors de la récupération des réservations' }, { status: 500 });
        } finally {
            await prisma.$disconnect();
        }
    })
}