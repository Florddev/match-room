"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Home,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

type Booking = {
  id: string;
  price: number;
  startDate: string;
  endDate: string;
  status: string;
  room: {
    id: string;
    name: string;
    price: number;
    hotel: {
      id: string;
      name: string;
      address: string;
      city: string;
      zipCode: string;
    };
  };
};

export default function BookingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (user == null) {
      router.push("/auth/login?redirect=/bookings");
      return;
    }
    fetchBookings();
  }, [status, router]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/bookings", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Impossible de récupérer vos réservations");
      }

      const data = await response.json();
      setBookings(data);
    } catch (err) {
      console.error("Erreur lors de la récupération des réservations:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  // Formater les dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy", { locale: fr });
  };

  // Calculer la durée du séjour
  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Vérifier si la réservation est à venir, en cours ou passée
  const getBookingStatus = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    if (today < start) {
      return { label: "À venir", color: "bg-blue-100 text-blue-700" };
    } else if (today >= start && today <= end) {
      return { label: "En cours", color: "bg-green-100 text-green-700" };
    } else {
      return { label: "Passée", color: "bg-gray-100 text-gray-700" };
    }
  };

  const getPaymentStatusStyle = (status: string) => {
    switch (status) {
      case "PAID":
        return { label: "Payé", color: "bg-green-100 text-green-700" };
      case "PENDING":
        return { label: "En attente", color: "bg-yellow-100 text-yellow-700" };
      case "CANCELLED":
        return { label: "Annulé", color: "bg-red-100 text-red-700" };
      default:
        return { label: status, color: "bg-gray-100 text-gray-700" };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-lg text-gray-600">
            Chargement de vos réservations...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-lg px-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button
            onClick={() => router.push("/")}
            className="bg-primary hover:bg-primary/90"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mes réservations</h1>
        <p className="text-gray-500 mt-2">
          Consultez et gérez vos réservations
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Aucune réservation pour le moment
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Vous n'avez pas encore de réservation. Explorez nos chambres et
            réservez votre prochain séjour.
          </p>
          <Button
            onClick={() => router.push("/rooms")}
            className="bg-primary hover:bg-primary/90"
          >
            Découvrir nos chambres
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => {
            const status = getBookingStatus(booking.startDate, booking.endDate);
            const paymentStatus = getPaymentStatusStyle(booking.status);
            const duration = calculateDuration(
              booking.startDate,
              booking.endDate
            );

            return (
              <Card key={booking.id} className="overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src="/hotel.jpg"
                    alt={booking.room.name}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium`}
                  >
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}
                    >
                      {status.label}
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${paymentStatus.color}`}
                    >
                      {paymentStatus.label}
                    </div>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle>{booking.room.name}</CardTitle>
                  <CardDescription>{booking.room.hotel.name}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Date du séjour</p>
                      <p className="text-sm text-gray-500">
                        Du {formatDate(booking.startDate)} au{" "}
                        {formatDate(booking.endDate)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {duration} nuit{duration > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-sm text-gray-500">
                        {booking.room.hotel.address}, {booking.room.hotel.city}{" "}
                        {booking.room.hotel.zipCode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Arrivée & Départ</p>
                      <p className="text-sm text-gray-500">
                        Arrivée à partir de 14h, départ jusqu'à 11h
                      </p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between items-center border-t pt-4">
                  <div>
                    <p className="text-lg font-bold">{booking.price} €</p>
                    <p className="text-xs text-gray-500">Prix total</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-sm"
                    onClick={() => router.push(`/room/${booking.room.id}`)}
                  >
                    Voir la chambre
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
