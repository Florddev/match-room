import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { withServerAuth } from "@/lib/auth-server-utils";
import prisma from "@/lib/prisma";

// Initialiser Stripe avec ta clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function POST(request: NextRequest) {
  return withServerAuth(async (user) => {
    try {
      const data = await request.json();
      const { roomId, startDate, endDate, price, guestCount = 1 } = data;

      if (!roomId || !startDate || !endDate || !price) {
        return NextResponse.json(
          { error: "Données de réservation incomplètes" },
          { status: 400 }
        );
      }

      // Récupérer les détails de la chambre
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { hotel: true },
      });

      if (!room) {
        return NextResponse.json(
          { error: "Chambre introuvable" },
          { status: 404 }
        );
      }

      // Vérifier la disponibilité
      const existingBooking = await prisma.booking.findFirst({
        where: {
          roomId,
          status: { not: "CANCELLED" },
          OR: [
            {
              AND: [
                { startDate: { lte: new Date(startDate) } },
                { endDate: { gte: new Date(startDate) } },
              ],
            },
            {
              AND: [
                { startDate: { lte: new Date(endDate) } },
                { endDate: { gte: new Date(endDate) } },
              ],
            },
            {
              AND: [
                { startDate: { gte: new Date(startDate) } },
                { endDate: { lte: new Date(endDate) } },
              ],
            },
          ],
        },
      });

      if (existingBooking) {
        return NextResponse.json(
          { error: "La chambre n'est pas disponible pour ces dates" },
          { status: 409 }
        );
      }

      // Créer la réservation avec statut PENDING
      const booking = await prisma.booking.create({
        data: {
          roomId,
          userId: user.id,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          price: parseFloat(price.toString()),
          guestCount,
          status: "PENDING",
        },
      });

      // Créer une session de paiement Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/rooms/${roomId}?cancelled=true`,
        line_items: [
          {
            price_data: {
              currency: "eur",
              unit_amount: Math.round(parseFloat(price.toString()) * 100),
              product_data: {
                name: `Réservation - ${room.hotel.name} - ${room.name}`,
                description: `Du ${new Date(
                  startDate
                ).toLocaleDateString()} au ${new Date(
                  endDate
                ).toLocaleDateString()}`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          bookingId: booking.id,
          userId: user.id,
        },
      });

      // Sauvegarder l'ID de la session Stripe avec la réservation
      await prisma.booking.update({
        where: { id: booking.id },
        data: { stripeSessionId: session.id },
      });

      return NextResponse.json({
        sessionUrl: session.url,
        sessionId: session.id,
      });
    } catch (error) {
      console.error("Erreur:", error);
      return NextResponse.json(
        { error: "Erreur lors de la création du paiement" },
        { status: 500 }
      );
    }
  });
}
