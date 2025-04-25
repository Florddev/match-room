import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(_request: Request) {
  try {
    const rooms = await prisma.room.findMany();
    return NextResponse.json(rooms);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to fetch rooms' }, { status: 500 });
  }
}