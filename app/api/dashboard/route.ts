import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withServerAuth } from "@/lib/auth-server-utils";

export async function GET() {
  return withServerAuth(async (user) => {
    try {
      const userId = user.id;

      const hotelsCount = await prisma.usersHotels.count({
        where: {
          userId: userId,
        },
      });

      const roomsCount = await prisma.room.count({
        where: {
          hotel: {
            users: {
              some: {
                userId: userId,
              },
            },
          },
        },
      });

      const bookingsCount = await prisma.booking.count({
        where: {
          userId: userId,
        },
      });

      const negotiationsCount = await prisma.negotiation.count({
        where: {
          userId: userId,
        },
      });

      return NextResponse.json({
        hotelsCount,
        roomsCount,
        bookingsCount,
        negotiationsCount,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des données du tableau de bord:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des données" },
        { status: 500 }
      );
    }
  });
}