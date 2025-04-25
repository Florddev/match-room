import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { withServerAuth } from "@/lib/auth-server-utils";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withServerAuth(async (user) => {
    try {
      const bookingId = params.id;
      const { sessionId } = await request.json();

      if (!bookingId || !sessionId) {
        return NextResponse.json(
          { error: "Données manquantes" },
          { status: 400 }
        );
      }

      // Vérifier que la réservation existe et appartient à l'utilisateur
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          userId: user.id,
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: "Réservation non trouvée" },
          { status: 404 }
        );
      }

      // Vérifier l'état de la session Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== "paid") {
        return NextResponse.json(
          { error: "Le paiement n'a pas été effectué" },
          { status: 400 }
        );
      }

      // Mettre à jour le statut de la réservation
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "PAID",
        },
      });

      return NextResponse.json({
        success: true,
        booking: updatedBooking,
      });
    } catch (error) {
      console.error("Erreur lors de la confirmation de la réservation:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la confirmation de la réservation",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  });
}
