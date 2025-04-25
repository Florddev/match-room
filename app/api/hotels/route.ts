import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_request: Request) {
  try {
    const hotels = await prisma.hotel.findMany();
    return NextResponse.json(hotels);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to fetch rooms" },
      { status: 500 }
    );
  }
}
