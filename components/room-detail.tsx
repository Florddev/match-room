"use client";

import {
  ArrowLeft,
  Check,
  Euro,
  Heart,
  MapPin,
  Share,
  Star,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { NegotiationDialog } from "@/components/negotiation-dialog";

// Types
type RoomType = {
  id: string;
  name: string;
};

type HotelType = {
  id: string;
  name: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
  rate: number;
};

type RoomWithRelations = {
  id: string;
  name: string;
  price: number;
  rate: number;
  maxOccupancy: number;
  content: string;
  categories: string;
  tags: string;
  hotelId: string;
  createdAt: string;
  updatedAt: string;
  hotel: HotelType;
  types: {
    type: RoomType;
  }[];
};

type RoomParams = {
  id: string;
};

type AvailabilityResponse = {
  available: boolean;
  conflictingBookings: number;
  conflictingNegotiations: number;
};

export default function RoomDetail({ params }: { params: RoomParams }) {
  const { user } = useAuth();
  // Déballer les paramètres avec use() et le bon typage
  const unwrappedParams = use(params as unknown as Promise<RoomParams>);
  const roomId = unwrappedParams.id;
  const isAuthenticated = user !== null;

  const [room, setRoom] = useState<RoomWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");
  const [guestCount, setGuestCount] = useState(1);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const router = useRouter();

  // États pour la réservation
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isRoomAvailable, setIsRoomAvailable] = useState<boolean | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // États pour la négociation
  const [showNegotiationDialog, setShowNegotiationDialog] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchRoomData() {
      if (!roomId) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`/api/rooms/${roomId}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        clearTimeout(timeoutId);

        const data = await res.json();

        if (isMounted) {
          setRoom(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Une erreur s'est produite"
          );
          setIsLoading(false);
        }
      }
    }

    fetchRoomData();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // Réinitialiser l'état de disponibilité lorsque les dates changent
  useEffect(() => {
    setIsRoomAvailable(null);
  }, [checkInDate, checkOutDate]);

  const toggleFavorite = () => {
    setIsFavorite((prev) => !prev);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % 5);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + 5) % 5);
  };

  // Fonction pour vérifier la disponibilité de la chambre
  const checkAvailability = async () => {
    if (!checkInDate || !checkOutDate) {
      toast("Dates requises", {
        description: "Veuillez sélectionner une date d'arrivée et de départ",
      });
      return;
    }

    // Validation des dates
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      toast("Date invalide", {
        description: "La date d'arrivée doit être aujourd'hui ou ultérieure",
      });
      return;
    }

    if (endDate <= startDate) {
      toast("Dates invalides", {
        description:
          "La date de départ doit être postérieure à la date d'arrivée",
      });
      return;
    }

    setCheckingAvailability(true);
    try {
      const response = await fetch(
        `/api/rooms/${roomId}/availability?startDate=${checkInDate}&endDate=${checkOutDate}`
      );
      const data: AvailabilityResponse = await response.json();
      setIsRoomAvailable(data.available);
    } catch (err) {
      console.error("Erreur lors de la vérification de disponibilité:", err);
      toast("Erreur", {
        description: "Impossible de vérifier la disponibilité",
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!room || !checkInDate || !checkOutDate) return 0;

    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return room.price * diffDays;
  };

  const totalPrice = calculateTotalPrice();
  const serviceFee = Math.round(totalPrice * 0.12);
  const finalPrice = totalPrice + serviceFee;

  // Fonction pour démarrer le processus de réservation
  const handleBookNow = async () => {
    if (!checkInDate || !checkOutDate) {
      toast("Dates requises", {
        description: "Veuillez sélectionner une date d'arrivée et de départ",
      });
      return;
    }

    // Vérifier d'abord si l'utilisateur est connecté
    if (!isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }

    // Si la disponibilité n'a pas encore été vérifiée, la vérifier maintenant
    if (isRoomAvailable === null) {
      await checkAvailability();
      // Continuer seulement si la chambre est disponible
      if (!isRoomAvailable) return;
    }

    // Si la chambre n'est pas disponible, afficher un message d'erreur
    if (isRoomAvailable === false) {
      toast("Chambre non disponible", {
        description:
          "Cette chambre n'est pas disponible pour les dates sélectionnées",
      });
      return;
    }

    // Tout est bon, ouvrir la boîte de dialogue de confirmation
    setShowConfirmationDialog(true);
  };

  const confirmBooking = async () => {
    setIsBooking(true);
    setBookingError(null);

    try {
      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          startDate: checkInDate,
          endDate: checkOutDate,
          price: finalPrice,
          guestCount,
        }),
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        throw new Error(
          errorData.error || "Échec de la création de la session de paiement"
        );
      }

      const { sessionUrl } = await checkoutResponse.json();

      // Rediriger vers la page de paiement Stripe
      window.location.href = sessionUrl;
    } catch (err) {
      console.error("Erreur lors de la réservation:", err);
      setBookingError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la réservation"
      );
      setIsBooking(false);
    }
  };

  // Fonction pour finaliser la réservation
  const confirmBookingWithoutPayment = async () => {
    setIsBooking(true);
    setBookingError(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          startDate: checkInDate,
          endDate: checkOutDate,
          price: finalPrice,
          status: "PENDING",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de la réservation");
      }

      // Réservation réussie
      setBookingSuccess(true);
      toast("Réservation confirmée", {
        description: "Votre réservation a été enregistrée avec succès!",
      });

      // Fermer la boîte de dialogue après 2 secondes
      setTimeout(() => {
        setShowConfirmationDialog(false);
        // Rediriger vers la page de réservations
        router.push("/bookings");
      }, 2000);
    } catch (err) {
      console.error("Erreur lors de la réservation:", err);
      setBookingError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la réservation"
      );
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">
            Chargement des informations...
          </p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-lg px-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-700 mb-6">
            {error || "Impossible de charger les informations de la chambre"}
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const roomTags = room.tags.split(",").map((tag) => tag.trim());
  const roomCategories = room.categories
    .split(",")
    .map((category) => category.trim());

  // Amenities from tags and categories
  const amenities = [...roomTags, ...roomCategories];
  const displayedAmenities = showAllAmenities
    ? amenities
    : amenities.slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête avec bouton retour */}
      <div className="mb-6">
        <Link
          href="/rooms"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux chambres
        </Link>
      </div>

      {/* Titre et actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium">{room.name}</h1>
          <div className="flex items-center mt-1 text-sm">
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-current text-black mr-1" />
              <span className="font-medium mr-1">{room.rate}</span>
            </div>
            <span className="mx-2">•</span>
            <span className="text-gray-600 underline">
              {room.hotel.city}, {room.hotel.zipCode}
            </span>
          </div>
        </div>

        <div className="flex items-center mt-4 md:mt-0 space-x-4">
          <button className="flex items-center text-sm font-medium hover:underline">
            <Share className="h-4 w-4 mr-2" />
            Partager
          </button>
          <button
            onClick={toggleFavorite}
            className="flex items-center text-sm font-medium hover:underline"
          >
            <Heart
              className={`h-4 w-4 mr-2 ${
                isFavorite ? "fill-primary text-primary" : ""
              }`}
            />
            Enregistrer
          </button>
        </div>
      </div>

      {/* Galerie d'images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8">
        <div className="relative rounded-l-xl overflow-hidden aspect-[4/3]">
          <img
            src="/hotel.jpg"
            alt={room.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md opacity-0 hover:opacity-100 transition-opacity"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`relative overflow-hidden ${
                i === 1 ? "rounded-tr-xl" : i === 3 ? "rounded-br-xl" : ""
              }`}
            >
              <img
                src="/hotel.jpg"
                alt={`Vue ${i + 2}`}
                className="w-full h-full object-cover aspect-square"
              />
              {i === 3 && (
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md opacity-0 hover:opacity-100 transition-opacity"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Informations principales */}
        <div className="lg:col-span-2">
          {/* Hôtel et hôte */}
          <div className="flex justify-between items-start pb-6 border-b">
            <div>
              <h2 className="text-xl font-medium">
                Chambre dans l'hôtel {room.hotel.name}
              </h2>
              <p className="text-gray-600 mt-1">
                <MapPin className="inline-block h-4 w-4 mr-1" />
                {room.hotel.address}, {room.hotel.city} {room.hotel.zipCode}
              </p>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">
                  {room.maxOccupancy} voyageurs maximum
                </span>{" "}
                • {room.types.map((t) => t.type.name).join(", ")}
              </p>
            </div>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-6 w-6 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="py-6 border-b">
            <h2 className="text-xl font-medium mb-4">
              À propos de cette chambre
            </h2>
            <p className="text-gray-700 whitespace-pre-line">{room.content}</p>
          </div>

          {/* Caractéristiques */}
          <div className="py-6 border-b">
            <h2 className="text-xl font-medium mb-4">
              Ce que propose cette chambre
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayedAmenities.map((amenity, index) => (
                <div key={index} className="flex items-center">
                  <Check className="h-5 w-5 mr-3 text-gray-500" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
            {amenities.length > 8 && (
              <button
                onClick={() => setShowAllAmenities(!showAllAmenities)}
                className="mt-4 px-4 py-2 border border-gray-900 rounded-lg font-medium text-sm hover:bg-gray-100"
              >
                {showAllAmenities
                  ? "Afficher moins"
                  : `Afficher les ${
                      amenities.length - 8
                    } équipements supplémentaires`}
              </button>
            )}
          </div>

          {/* Catégories */}
          <div className="py-6">
            <h2 className="text-xl font-medium mb-4">Catégories</h2>
            <div className="flex flex-wrap gap-2">
              {roomCategories.map((category, index) => (
                <span
                  key={`cat-${index}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          {/* Informations sur l'hôtel */}
          <div className="py-6 border-t">
            <h2 className="text-xl font-medium mb-4">À propos de l'hôtel</h2>
            <div className="flex items-start mb-4">
              <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center mr-4">
                <img
                  src="/hotel.jpg"
                  alt={room.hotel.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div>
                <h3 className="font-medium">{room.hotel.name}</h3>
                <div className="flex items-center mt-1">
                  <Star className="h-4 w-4 fill-current text-black mr-1" />
                  <span className="font-medium mr-1">{room.hotel.rate}</span>
                </div>
                <p className="text-gray-600 text-sm mt-1">{room.hotel.phone}</p>
              </div>
            </div>
            <Link
              href={`/dashboard/hotels/${room.hotel.id}`}
              className="text-primary font-medium hover:underline"
            >
              Voir plus d'informations sur cet hôtel
            </Link>
          </div>
        </div>

        {/* Réservation */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 border border-gray-200 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-xl font-semibold">{room.price} €</span>
                <span className="text-gray-500"> / nuit</span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-current text-black mr-1" />
                <span className="font-medium">{room.rate}</span>
              </div>
            </div>

            <div className="border border-gray-300 rounded-t-lg overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-gray-300">
                <div className="p-3">
                  <label className="block text-xs font-semibold">ARRIVÉE</label>
                  <input
                    type="date"
                    className="w-full border-none p-0 text-sm focus:ring-0"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="p-3">
                  <label className="block text-xs font-semibold">DÉPART</label>
                  <input
                    type="date"
                    className="w-full border-none p-0 text-sm focus:ring-0"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate || new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
              <div className="border-t border-gray-300 p-3">
                <label className="block text-xs font-semibold">VOYAGEURS</label>
                <select
                  className="w-full border-none p-0 text-sm focus:ring-0"
                  value={guestCount}
                  onChange={(e) =>
                    setGuestCount(Number.parseInt(e.target.value))
                  }
                >
                  {[...Array(room.maxOccupancy || 4)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} voyageur{i > 0 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Affichage des informations de disponibilité */}
            {isRoomAvailable !== null && (
              <div className="mt-4">
                {isRoomAvailable ? (
                  <Alert className="bg-green-50 border-green-200">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-600">
                      Disponible
                    </AlertTitle>
                    <AlertDescription className="text-green-600">
                      Cette chambre est disponible pour les dates sélectionnées.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Non disponible</AlertTitle>
                    <AlertDescription>
                      Cette chambre n'est pas disponible pour les dates
                      sélectionnées.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Bouton pour vérifier la disponibilité */}
            {checkInDate && checkOutDate && isRoomAvailable === null && (
              <Button
                className="w-full mt-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                onClick={checkAvailability}
                disabled={checkingAvailability}
              >
                {checkingAvailability ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  "Vérifier la disponibilité"
                )}
              </Button>
            )}

            {/* Bouton de réservation */}
            <Button
              className="w-full mt-4 py-3 rounded-lg bg-gradient-to-r from-[#E61E4D] to-[#D70466] hover:from-[#D70466] hover:to-[#BD1E59] text-white font-medium"
              onClick={handleBookNow}
              disabled={
                checkingAvailability ||
                isRoomAvailable === false ||
                !checkInDate ||
                !checkOutDate
              }
            >
              Réserver
            </Button>

            {checkInDate && checkOutDate && (
              <div className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="underline">
                    {room.price} € x {totalPrice / room.price} nuits
                  </span>
                  <span>{totalPrice} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="underline">Frais de service</span>
                  <span>{serviceFee} €</span>
                </div>
                <div className="flex justify-between font-semibold pt-3 border-t">
                  <span>Total</span>
                  <span>{finalPrice} €</span>
                </div>
              </div>
            )}

            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full border-gray-300 hover:border-gray-500 rounded-lg"
                onClick={() => setShowNegotiationDialog(true)}
                disabled={!checkInDate || !checkOutDate}
              >
                <Euro className="h-4 w-4 mr-2" />
                Proposer un prix
              </Button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              Vous ne serez pas débité pour le moment
            </p>
          </div>
        </div>
      </div>

      {/* Boîte de dialogue de connexion */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connexion requise</DialogTitle>
            <DialogDescription>
              Vous devez être connecté pour effectuer une réservation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <p>Veuillez vous connecter pour continuer la réservation.</p>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowLoginDialog(false);
                router.push(`/auth/login?redirect=/room/${roomId}`);
              }}
            >
              Se connecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue de confirmation de réservation */}
      <Dialog
        open={showConfirmationDialog}
        onOpenChange={setShowConfirmationDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer votre réservation</DialogTitle>
            <DialogDescription>
              Veuillez vérifier les détails de votre réservation avant de
              confirmer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm">Date d'arrivée</h4>
                  <p>{new Date(checkInDate).toLocaleDateString("fr-FR")}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Date de départ</h4>
                  <p>{new Date(checkOutDate).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm">Chambre</h4>
                <p>{room.name}</p>
                <p className="text-sm text-gray-600">{room.hotel.name}</p>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-sm">Détails du prix</h4>
                <div className="flex justify-between text-sm mt-2">
                  <span>
                    {room.price} € x {totalPrice / room.price} nuits
                  </span>
                  <span>{totalPrice} €</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Frais de service</span>
                  <span>{serviceFee} €</span>
                </div>
                <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                  <span>Total</span>
                  <span>{finalPrice} €</span>
                </div>
              </div>

              {bookingError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>{bookingError}</AlertDescription>
                </Alert>
              )}

              {bookingSuccess && (
                <Alert className="bg-green-50 border-green-200 mt-4">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">
                    Réservation confirmée
                  </AlertTitle>
                  <AlertDescription className="text-green-600">
                    Votre réservation a été effectuée avec succès!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setShowConfirmationDialog(false)}
              disabled={isBooking || bookingSuccess}
            >
              Annuler
            </Button>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={confirmBookingWithoutPayment}
                disabled={isBooking || bookingSuccess}
              >
                Réserver sans payer
              </Button>
              <Button
                type="button"
                onClick={confirmBooking}
                disabled={isBooking || bookingSuccess}
                className={
                  bookingSuccess ? "bg-green-600 hover:bg-green-700" : ""
                }
              >
                {isBooking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : bookingSuccess ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Réservé
                  </>
                ) : (
                  "Payer maintenant"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue de négociation */}
      {room && (
        <NegotiationDialog
          isOpen={showNegotiationDialog}
          onClose={() => setShowNegotiationDialog(false)}
          room={room}
          startDate={checkInDate}
          endDate={checkOutDate}
        />
      )}
    </div>
  );
}
