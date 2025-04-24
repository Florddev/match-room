import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withServerAuth } from "@/lib/auth-server-utils";
import { z } from "zod";

// Schéma de validation pour la mise à jour d'un hôtel
const hotelUpdateSchema = z.object({
    name: z.string().min(2),
    rate: z.number().min(0).max(5),
    address: z.string().min(5),
    city: z.string().min(2),
    zipCode: z.string().min(3),
    phone: z.string().min(5),
});

// Méthode GET pour récupérer un hôtel spécifique
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withServerAuth(async (user) => {
        try {
            const userId = user.id;
            const hotelId = params.id;

            // Récupérer les détails complets de l'hôtel
            const hotel = await prisma.hotel.findFirst({
                where: {
                    id: hotelId,
                    users: {
                        some: {
                            userId: userId,
                        },
                    },
                },
                include: {
                    rooms: {
                        include: {
                            types: {
                                include: {
                                    type: true,
                                },
                            },
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

            // Récupérer des statistiques supplémentaires si nécessaire
            // Par exemple, vous pourriez vouloir récupérer le nombre total de réservations, etc.

            return NextResponse.json({ hotel });
        } catch (error) {
            console.error("Erreur lors de la récupération des détails de l'hôtel:", error);
            return NextResponse.json(
                { error: "Erreur lors de la récupération des détails de l'hôtel" },
                { status: 500 }
            );
        }
    });
}

// Méthode PUT pour mettre à jour un hôtel
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withServerAuth(async (user) => {
        try {
            const userId = user.id;
            const hotelId = params.id;

            // Récupérer les données du corps de la requête
            const body = await request.json();

            // Valider les données reçues
            const validationResult = hotelUpdateSchema.safeParse(body);

            if (!validationResult.success) {
                return NextResponse.json(
                    { error: "Données invalides", details: validationResult.error.format() },
                    { status: 400 }
                );
            }

            // Vérifier que l'hôtel existe et appartient à l'utilisateur
            const hotelExists = await prisma.hotel.findFirst({
                where: {
                    id: hotelId,
                    users: {
                        some: {
                            userId: userId,
                        },
                    },
                },
            });

            if (!hotelExists) {
                return NextResponse.json(
                    { error: "Hôtel non trouvé ou vous n'avez pas l'autorisation de le modifier" },
                    { status: 404 }
                );
            }

            const hotelData = validationResult.data;

            // Mettre à jour l'hôtel
            const updatedHotel = await prisma.hotel.update({
                where: {
                    id: hotelId,
                },
                data: {
                    name: hotelData.name,
                    rate: hotelData.rate,
                    address: hotelData.address,
                    city: hotelData.city,
                    zipCode: hotelData.zipCode,
                    phone: hotelData.phone,
                },
            });

            return NextResponse.json({ hotel: updatedHotel });
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'hôtel:", error);
            return NextResponse.json(
                { error: "Erreur lors de la mise à jour de l'hôtel" },
                { status: 500 }
            );
        }
    });
}

// Méthode DELETE pour supprimer un hôtel
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withServerAuth(async (user) => {
        try {
            const userId = user.id;
            const hotelId = params.id;

            // Vérifier que l'hôtel existe et appartient à l'utilisateur
            const hotelExists = await prisma.hotel.findFirst({
                where: {
                    id: hotelId,
                    users: {
                        some: {
                            userId: userId,
                        },
                    },
                },
            });

            if (!hotelExists) {
                return NextResponse.json(
                    { error: "Hôtel non trouvé ou vous n'avez pas l'autorisation de le supprimer" },
                    { status: 404 }
                );
            }

            // Supprimer l'hôtel
            await prisma.hotel.delete({
                where: {
                    id: hotelId,
                },
            });

            return NextResponse.json({ success: true });
        } catch (error) {
            console.error("Erreur lors de la suppression de l'hôtel:", error);
            return NextResponse.json(
                { error: "Erreur lors de la suppression de l'hôtel" },
                { status: 500 }
            );
        }
    });
}