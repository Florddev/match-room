"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Euro, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { differenceInDays } from "date-fns"

interface NegotiationDialogProps {
  isOpen: boolean
  onClose: () => void
  room: {
    id: string
    name: string
    price: number
    hotel: {
      name: string
    }
  }
  startDate: string
  endDate: string
}

export function NegotiationDialog({ isOpen, onClose, room, startDate, endDate }: NegotiationDialogProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [price, setPrice] = useState<number>(room.price * 0.9) // Start at 90% of original price
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Calculate minimum price (70% of original price)
  const minPrice = Math.round(room.price * 0.7)
  // Calculate maximum price (100% of original price)
  const maxPrice = room.price
  
  // Calculate number of nights
  const nights = startDate && endDate 
    ? differenceInDays(new Date(endDate), new Date(startDate))
    : 0
  
  // Calculate total price
  const totalOriginalPrice = room.price * nights
  const totalNegotiatedPrice = price * nights
  const savings = totalOriginalPrice - totalNegotiatedPrice

  useEffect(() => {
    // Reset state when dialog opens
    if (isOpen) {
      setPrice(room.price * 0.9)
      setIsSubmitting(false)
      setSuccess(false)
    }
  }, [isOpen, room.price])

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    setPrice(value[0])
  }

  // Handle manual price input
  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseInt(e.target.value)
    if (!isNaN(newPrice)) {
      // Ensure the price stays within bounds
      setPrice(Math.min(Math.max(newPrice, minPrice), maxPrice))
    }
  }

  // Handle submit negotiation
  const handleSubmit = async () => {
    if (!user) {
      // If not logged in, close this dialog and open the login dialog
      onClose()
      router.push(`/auth/login?redirect=/room/${room.id}`)
      return
    }

    if (!startDate || !endDate) {
      toast("Dates requises", {
        description: "Veuillez sélectionner les dates de votre séjour"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/negotiations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roomId: room.id,
          price,
          startDate,
          endDate
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de la négociation")
      }

      // Success
      setSuccess(true)
      toast("Proposition envoyée", {
        description: "Votre proposition de prix a été envoyée avec succès"
      })

      // Close dialog after 2 seconds
      setTimeout(() => {
        onClose()
        // Redirect to negotiations page
        router.push("/negotiations")
      }, 2000)
    } catch (error: any) {
      toast("Erreur", {
        description: error.message || "Une erreur est survenue lors de l'envoi de votre proposition"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Proposer un prix</DialogTitle>
          <DialogDescription>
            Faites une offre pour réserver cette chambre à un prix négocié
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div>
            <h3 className="font-medium mb-1">{room.name}</h3>
            <p className="text-sm text-gray-500">{room.hotel.name}</p>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-sm">Prix affiché:</span>
              <span className="font-medium">{formatCurrency(room.price)}/nuit</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Votre offre:</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={price}
                  onChange={handlePriceInput}
                  min={minPrice}
                  max={maxPrice}
                  className="w-20 text-right"
                />
                <span>€</span>
              </div>
            </div>

            <Slider
              defaultValue={[price]}
              min={minPrice}
              max={maxPrice}
              step={1}
              value={[price]}
              onValueChange={handleSliderChange}
              className="my-4"
            />

            <div className="flex justify-between text-sm text-gray-500">
              <span>Min: {formatCurrency(minPrice)}</span>
              <span>Max: {formatCurrency(maxPrice)}</span>
            </div>
          </div>

          {nights > 0 && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Prix original ({nights} nuits):</span>
                <span>{formatCurrency(totalOriginalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Votre offre ({nights} nuits):</span>
                <span>{formatCurrency(totalNegotiatedPrice)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Économie potentielle:</span>
                <span>{formatCurrency(savings)} ({Math.round((savings / totalOriginalPrice) * 100)}%)</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
            <p>
              <strong>Comment ça marche ?</strong>
            </p>
            <p className="mt-1">
              Votre proposition sera envoyée à l'hôtelier qui pourra l'accepter, la refuser ou faire une contre-offre.
              Vous recevrez une notification dès qu'une réponse sera disponible.
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting || success}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || success}
            className={success ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : success ? (
              "Proposition envoyée"
            ) : (
              <>
                <Euro className="mr-2 h-4 w-4" />
                Envoyer ma proposition
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}