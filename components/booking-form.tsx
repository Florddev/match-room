"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatCurrency } from "@/lib/utils"
import { CalendarIcon, Users } from "lucide-react"
import type { Room } from "@/models"
import { format, differenceInDays } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

interface BookingFormProps {
  room: Room
}

export function BookingForm({ room }: BookingFormProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to?: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [guestCount, setGuestCount] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!dateRange.from || !dateRange.to) return 0

    const diffDays = differenceInDays(dateRange.to, dateRange.from)
    return room.price * (diffDays > 0 ? diffDays : 0)
  }

  const totalPrice = calculateTotalPrice()
  const serviceFee = Math.round(totalPrice * 0.12)
  const totalWithFees = totalPrice + serviceFee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dateRange.from || !dateRange.to) {
      toast.error("Veuillez sélectionner des dates pour votre séjour")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast.success("Réservation effectuée avec succès!", {
        description: `Votre séjour du ${format(dateRange.from, "dd/MM/yyyy", { locale: fr })} au ${format(dateRange.to, "dd/MM/yyyy", { locale: fr })} a été réservé.`,
      })

      // Reset form
      setDateRange({ from: undefined, to: undefined })
    } catch (error) {
      toast.error("Erreur lors de la réservation", {
        description: "Veuillez réessayer ultérieurement.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Dates</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
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
              onSelect={(value) => setDateRange(value || { from: undefined, to: undefined })}
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
            onClick={() => setGuestCount(Math.min(room.maxOccupancy, guestCount + 1))}
            disabled={guestCount >= room.maxOccupancy}
          >
            +
          </Button>
        </div>
        <p className="text-xs text-gray-500">Maximum {room.maxOccupancy} voyageurs</p>
      </div>

      {dateRange.from && dateRange.to && (
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between">
            <span>
              {formatCurrency(room.price)} x {differenceInDays(dateRange.to, dateRange.from)} nuits
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

      <Button type="submit" className="w-full" disabled={!dateRange.from || !dateRange.to || isSubmitting}>
        {isSubmitting ? "Traitement en cours..." : "Réserver"}
      </Button>

      <p className="text-xs text-center text-gray-500">Vous ne serez pas débité pour le moment</p>
    </form>
  )
}
