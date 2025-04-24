import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withServerAuth } from "@/lib/auth-server-utils";
import { z } from "zod";

const hotelSchema = z.object({
    name: z.string().min(2),
    rate: z.number().min(0).max(5),
    address: z.string().min(5),
    city: z.string().min(2),
    zipCode: z.string().min(3),
    phone: z.string().min(5),
});

export async function GET() {
    return withServerAuth(async (user) => {
        try {
            const userId = user.id;

            // Récupérer les hôtels de l'utilisateur
            const userHotels = await prisma.hotel.findMany({
                where: {
                    users: {
                        some: {
                            userId: userId,
                        },
                    },
                },
                include: {
                    rooms: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            return NextResponse.json({ hotels: userHotels });
        } catch (error) {
            console.error("Erreur lors de la récupération des hôtels:", error);
            return NextResponse.json(
                { error: "Erreur lors de la récupération des hôtels" },
                { status: 500 }
            );
        }
    });
}

export async function POST(request: NextRequest) {
    return withServerAuth(async (user) => {
        try {
            const userId = user.id;

            // Récupérer les données du corps de la requête
            const body = await request.json();

            // Valider les données reçues
            const validationResult = hotelSchema.safeParse(body);

            if (!validationResult.success) {
                return NextResponse.json(
                    { error: "Données invalides", details: validationResult.error.format() },
                    { status: 400 }
                );
            }

            const hotelData = validationResult.data;

            // Créer l'hôtel dans la base de données
            const newHotel = await prisma.hotel.create({
                data: {
                    name: hotelData.name,
                    rate: hotelData.rate,
                    address: hotelData.address,
                    city: hotelData.city,
                    zipCode: hotelData.zipCode,
                    phone: hotelData.phone,
                    // Associer l'hôtel à l'utilisateur
                    users: {
                        create: {
                            userId: userId,
                            // Vous pouvez ajouter d'autres champs si nécessaire, comme le rôle
                        }
                    },
                }
            });

            return NextResponse.json({ hotel: newHotel }, { status: 201 });
        } catch (error) {
            console.error("Erreur lors de la création de l'hôtel:", error);
            return NextResponse.json(
                { error: "Erreur lors de la création de l'hôtel" },
                { status: 500 }
            );
        }
    });
}