import prisma from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const hotelId = params.id

    const hotelExists = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { id: true }
    });

    if (!hotelExists) {
      return NextResponse.json({ error: "Hôtel non trouvé" }, { status: 404 });
    }

    const baseHotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
    });

    if (!baseHotel) {
      return NextResponse.json({ error: "Hôtel non trouvé" }, { status: 404 });
    }

    const rooms = await prisma.room.findMany({
      where: { hotelId: hotelId },
    });

    const enhancedRooms = await Promise.all(
      rooms.map(async (room) => {
        try {
          const types = await prisma.roomsTypes.findMany({
            where: { roomId: room.id },
            include: { type: true },
          });

          const bookings = await prisma.booking.findMany({
            where: { roomId: room.id },
            select: {
              startDate: true,
              endDate: true,
            },
          });

          const negotiations = await prisma.negotiation.findMany({
            where: { roomId: room.id },
            select: {
              status: true,
              price: true,
              startDate: true,
              endDate: true,
            },
          });

          return {
            ...room,
            types,
            bookings,
            negotiations,
          };
        } catch (error) {
          return {
            ...room,
            types: [],
            bookings: [],
            negotiations: [],
          };
        }
      })
    );

    const enhancedHotel = {
      ...baseHotel,
      rooms: enhancedRooms,
      roomCount: enhancedRooms.length,
      minPrice: enhancedRooms.length > 0
        ? Math.min(...enhancedRooms.filter(room => room.price).map(room => room.price))
        : 0,
      maxPrice: enhancedRooms.length > 0
        ? Math.max(...enhancedRooms.filter(room => room.price).map(room => room.price))
        : 0,
      averageRoomRate: enhancedRooms.length > 0
        ? enhancedRooms.filter(room => room.rate).reduce((sum, room) => sum + room.rate, 0) /
        enhancedRooms.filter(room => room.rate).length
        : 0,
      roomTypes: [...new Set(enhancedRooms.flatMap(room =>
        (room.types || []).map(typeRel => typeRel.type?.name || "").filter(Boolean)
      ))],
      roomCategories: [...new Set(enhancedRooms.flatMap(room =>
        room.categories ? room.categories.split(",").map(cat => cat.trim()).filter(Boolean) : []
      ))],
      roomTags: [...new Set(enhancedRooms.flatMap(room =>
        room.tags ? room.tags.split(",").map(tag => tag.trim()).filter(Boolean) : []
      ))],
    };

    return NextResponse.json(enhancedHotel);
  } catch (error) {

    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Erreur: ${error instanceof Error ? error.message : String(error)}`
      : "Erreur lors de la récupération des détails de l'hôtel";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}