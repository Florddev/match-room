// app/api/rooms/[id]/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const roomId = params.id;

        const room = await prisma.room.findUnique({
            where: {
                id: roomId,
            },
            include: {
                hotel: true,
                types: {
                    include: {
                        type: true,
                    },
                },
            },
        });

        if (!room) {
            return NextResponse.json(
                { error: 'Chambre non trouvée' },
                { status: 404 }
            );
        }

        return NextResponse.json(room);
    } catch (error) {
        return NextResponse.json(
            { error: 'Impossible de récupérer les informations de la chambre' },
            { status: 500 }
        );
    }
}