"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatCurrency } from "@/lib/utils";
import { CalendarIcon, CreditCard, Users, Wallet } from "lucide-react";
import type { Room } from "@/models";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface BookingFormProps {
  room: Room;
}

export function BookingForm({ room }: BookingFormProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to?: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [guestCount, setGuestCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "online" | "onsite" | null
  >(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!dateRange.from || !dateRange.to) return 0;

    const diffDays = differenceInDays(dateRange.to, dateRange.from);
    return room.price * (diffDays > 0 ? diffDays : 0);
  };

  const totalPrice = calculateTotalPrice();
  const serviceFee = Math.round(totalPrice * 0.12);
  const totalWithFees = totalPrice + serviceFee;

  const handleOnlinePay = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error("Veuillez sélectionner des dates pour votre séjour");
      return;
    }

    setIsSubmitting(true);

    try {
      // Créer une réservation avec statut PENDING
      const bookingResponse = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: room.id,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
          price: totalWithFees,
          guestCount,
        }),
      });

      if (!bookingResponse.ok) {
        throw new Error("Impossible de créer la réservation");
      }

      // Rediriger vers Stripe
      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: room.id,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
          price: totalWithFees,
          guestCount,
        }),
      });

      if (!checkoutResponse.ok) {
        throw new Error("Impossible de générer la session de paiement");
      }

      const { sessionUrl } = await checkoutResponse.json();

      // Rediriger vers la page de paiement Stripe
      window.location.href = sessionUrl;
    } catch (error) {
      console.error("Erreur lors de la réservation:", error);
      toast.error("Erreur lors de la réservation", {
        description: "Veuillez réessayer ultérieurement.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnsitePay = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error("Veuillez sélectionner des dates pour votre séjour");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: room.id,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
          price: totalWithFees,
          guestCount,
          status: "PENDING", // Statut en attente de paiement sur place
        }),
      });

      if (!response.ok) {
        throw new Error("Impossible de créer la réservation");
      }

      toast.success("Réservation en attente de paiement", {
        description: `Votre séjour du ${format(dateRange.from, "dd/MM/yyyy", {
          locale: fr,
        })} au ${format(dateRange.to, "dd/MM/yyyy", {
          locale: fr,
        })} est en attente.`,
      });

      // Réinitialiser le formulaire
      setDateRange({ from: undefined, to: undefined });
      setPaymentMethod(null);
      setIsPaymentDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de la réservation:", error);
      toast.error("Erreur lors de la réservation", {
        description: "Veuillez réessayer ultérieurement.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaymentDialog = () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error("Veuillez sélectionner des dates pour votre séjour");
      return;
    }
    setIsPaymentDialogOpen(true);
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          openPaymentDialog();
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium">Dates</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy", { locale: fr })} -{" "}
                      {format(dateRange.to, "dd/MM/yyyy", { locale: fr })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy", { locale: fr })
                  )
                ) : (
                  "Sélectionnez vos dates"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(value) =>
                  setDateRange(value || { from: undefined, to: undefined })
                }
                numberOfMonths={2}
                locale={fr}
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Voyageurs</label>
          <div className="flex items-center border rounded-md">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-none"
              onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
              disabled={guestCount <= 1}
            >
              -
            </Button>
            <div className="flex-1 text-center">
              <span className="flex items-center justify-center gap-1">
                <Users className="h-4 w-4" />
                {guestCount} voyageur{guestCount > 1 ? "s" : ""}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-none"
              onClick={() =>
                setGuestCount(Math.min(room.maxOccupancy, guestCount + 1))
              }
              disabled={guestCount >= room.maxOccupancy}
            >
              +
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Maximum {room.maxOccupancy} voyageurs
          </p>
        </div>

        {dateRange.from && dateRange.to && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between">
              <span>
                {formatCurrency(room.price)} x{" "}
                {differenceInDays(dateRange.to, dateRange.from)} nuits
              </span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Frais de service</span>
              <span>{formatCurrency(serviceFee)}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(totalWithFees)}</span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={!dateRange.from || !dateRange.to || isSubmitting}
        >
          {isSubmitting ? "Traitement en cours..." : "Réserver"}
        </Button>

        <p className="text-xs text-center text-gray-500">
          Vous ne serez débité qu'après confirmation
        </p>
      </form>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choisissez votre méthode de paiement</DialogTitle>
            <DialogDescription>
              Sélectionnez comment vous souhaitez procéder au paiement de votre
              réservation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button
              variant={paymentMethod === "online" ? "default" : "outline"}
              onClick={() => setPaymentMethod("online")}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-5 w-5" />
              Paiement en ligne
            </Button>
            <Button
              variant={paymentMethod === "onsite" ? "default" : "outline"}
              onClick={() => setPaymentMethod("onsite")}
              className="flex items-center gap-2"
            >
              <Wallet className="h-5 w-5" />
              Paiement sur place
            </Button>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (paymentMethod === "online") {
                  handleOnlinePay();
                } else if (paymentMethod === "onsite") {
                  handleOnsitePay();
                } else {
                  toast.error("Veuillez sélectionner une méthode de paiement");
                }
              }}
              disabled={!paymentMethod || isSubmitting}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
