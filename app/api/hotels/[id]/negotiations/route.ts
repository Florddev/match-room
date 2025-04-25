import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withServerAuth } from '@/lib/auth-server-utils';

// Récupérer les négociations pour un hôtel spécifique (accessible uniquement par les gestionnaires de l'hôtel)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withServerAuth(async (user) => {
    try {
      const hotelId = params.id;
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      
      // Vérifier que l'utilisateur est gestionnaire de cet hôtel
      const isHotelManager = await prisma.usersHotels.findFirst({
        where: {
          userId: user.id,
          hotelId
        }
      });

      if (!isHotelManager) {
        return NextResponse.json(
          { error: 'Vous n\'êtes pas autorisé à accéder aux négociations de cet hôtel' },
          { status: 403 }
        );
      }

      // Construire la clause where pour les négociations
      let whereClause: any = {
        room: {
          hotelId
        }
      };
      
      // Filtrer par statut si spécifié
      if (status) {
        whereClause.status = status;
      }

      // Récupérer les négociations
      const negotiations = await prisma.negotiation.findMany({
        where: whereClause,
        include: {
          room: true,
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true
            }
          }
        },
        orderBy: [
          { status: 'asc' }, // Pending first, then others
          { createdAt: 'desc' } // Most recent first
        ]
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