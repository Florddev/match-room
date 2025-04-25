"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("booking_id");
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  useEffect(() => {
    if (!bookingId || !sessionId) {
      router.push("/");
      return;
    }

    const updateBookingStatus = async () => {
      try {
        // Appeler l'API pour mettre à jour le statut de la réservation
        const response = await fetch(`/api/bookings/${bookingId}/confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              "Erreur lors de la confirmation de la réservation"
          );
        }

        setBookingConfirmed(true);
      } catch (err) {
        console.error("Erreur:", err);
        setError(
          err instanceof Error ? err.message : "Une erreur s'est produite"
        );
      } finally {
        setLoading(false);
      }
    };

    updateBookingStatus();
  }, [bookingId, sessionId, router]);

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-6 w-4/5 mb-8" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Alert variant="destructive" className="mb-8">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/">Retour à l'accueil</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center mb-8">
          <CheckCircle className="h-12 w-12 text-green-500 mr-4" />
          <div>
            <h1 className="text-2xl font-bold">Réservation confirmée!</h1>
            <p className="text-gray-600">
              Votre réservation a été confirmée et vous recevrez un email avec
              tous les détails.
            </p>
          </div>
        </div>

        <div className="mb-8 p-6 border border-green-100 bg-green-50 rounded-lg">
          <p className="text-center text-green-700">
            Merci pour votre réservation. Votre paiement a été traité avec
            succès.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild>
            <Link href="/bookings">
              Voir mes réservations
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
