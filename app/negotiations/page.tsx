"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Euro,
  Hotel,
  HourglassIcon,
  Loader2,
  MapPin,
  RefreshCcw,
  XCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

type Negotiation = {
  id: string
  price: number
  status: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  room: {
    id: string
    name: string
    price: number
    hotel: {
      id: string
      name: string
      address: string
      city: string
      zipCode: string
    }
  }
}

export default function NegotiationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (user === null) {
      router.push("/auth/login?redirect=/negotiations")
      return
    }

    fetchNegotiations()
  }, [user, router])

  const fetchNegotiations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/negotiations", {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Impossible de récupérer vos négociations")
      }

      const data = await response.json()
      setNegotiations(data)
    } catch (err) {
      console.error("Erreur lors de la récupération des négociations:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  const cancelNegotiation = async (negotiationId: string) => {
    try {
      setCancellingId(negotiationId)
      const response = await fetch(`/api/negotiations/${negotiationId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de l'annulation")
      }

      // Supprimer la négociation de la liste ou changer son statut
      setNegotiations(negotiations.map(neg =>
        neg.id === negotiationId ? { ...neg, status: 'cancelled' } : neg
      ))

      toast("Négociation annulée", {
        description: "Votre négociation a été annulée avec succès"
      })
    } catch (err) {
      console.error("Erreur lors de l'annulation de la négociation:", err)
      toast("Erreur", {
        description: err instanceof Error ? err.message : "Une erreur est survenue"
      })
    } finally {
      setCancellingId(null)
    }
  }

  // Formater les dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "d MMMM yyyy", { locale: fr })
  }

  // Calculer la durée du séjour
  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: "En attente",
          icon: <HourglassIcon className="h-4 w-4 mr-1" />,
          color: "bg-yellow-100 text-yellow-700"
        }
      case 'accepted':
        return {
          label: "Acceptée",
          icon: <CheckCircle className="h-4 w-4 mr-1" />,
          color: "bg-green-100 text-green-700"
        }
      case 'rejected':
        return {
          label: "Refusée",
          icon: <XCircle className="h-4 w-4 mr-1" />,
          color: "bg-red-100 text-red-700"
        }
      case 'countered':
        return {
          label: "Contre-offre",
          icon: <RefreshCcw className="h-4 w-4 mr-1" />,
          color: "bg-blue-100 text-blue-700"
        }
      case 'cancelled':
        return {
          label: "Annulée",
          icon: <XCircle className="h-4 w-4 mr-1" />,
          color: "bg-gray-100 text-gray-700"
        }
      default:
        return {
          label: status,
          icon: null,
          color: "bg-gray-100 text-gray-700"
        }
    }
  }

  // Calculate savings compared to original price
  const calculateSavings = (negotiation: Negotiation) => {
    const duration = calculateDuration(negotiation.startDate, negotiation.endDate)
    const originalTotal = negotiation.room.price * duration
    const negotiatedTotal = negotiation.price * duration
    const savings = originalTotal - negotiatedTotal
    const savingsPercent = Math.round((savings / originalTotal) * 100)

    return {
      originalTotal,
      negotiatedTotal,
      savings,
      savingsPercent
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-lg text-gray-600">Chargement de vos négociations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-lg px-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button onClick={() => router.push("/")} className="bg-primary hover:bg-primary/90">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mes négociations</h1>
        <p className="text-gray-500 mt-2">Suivez l'état de vos propositions de prix</p>
      </div>

      {negotiations.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Euro className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune négociation en cours</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Vous n'avez pas encore fait de proposition de prix. Explorez nos chambres et négociez le prix qui vous convient.
          </p>
          <Button onClick={() => router.push("/rooms")} className="bg-primary hover:bg-primary/90">
            Découvrir nos chambres
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {negotiations.map((negotiation) => {
            const status = getStatusBadge(negotiation.status)
            const duration = calculateDuration(negotiation.startDate, negotiation.endDate)
            const { originalTotal, negotiatedTotal, savings, savingsPercent } = calculateSavings(negotiation)

            return (
              <div
                key={negotiation.id}
                className="group flex flex-col h-full bg-white rounded-xl overflow-hidden hover:shadow-md transition-all border border-gray-200"
              >
                {/* Image et badges */}
                <div className="relative overflow-hidden aspect-[4/3]">
                  <img
                    src="/hotel.jpg"
                    alt={negotiation.room.name}
                    className="object-cover w-full h-full transition-transform group-hover:scale-105 duration-300"
                  />

                  {/* Badge de statut */}
                  <div className="absolute top-3 right-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${status.color}`}>
                      {status.icon}
                      {status.label}
                    </div>
                  </div>

                  {/* Prix négocié */}
                  <div className="absolute bottom-3 left-3 bg-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                    {negotiation.price} € <span className="text-xs font-normal">/ nuit</span>
                  </div>
                </div>

                {/* Informations de la négociation */}
                <div className="flex-grow p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900 line-clamp-1">{negotiation.room.name}</h3>
                  </div>

                  <div className="mt-2 text-gray-500 text-sm flex items-start">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 mr-1" />
                    <span className="line-clamp-1">
                      {negotiation.room.hotel.name}, {negotiation.room.hotel.zipCode} {negotiation.room.hotel.city}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Date du séjour</p>
                        <p className="text-sm text-gray-500">
                          Du {formatDate(negotiation.startDate)} au {formatDate(negotiation.endDate)}
                        </p>
                        <p className="text-sm text-gray-500">{duration} nuit{duration > 1 ? "s" : ""}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Euro className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Détails du prix</p>
                        <div className="grid grid-cols-2 gap-1 text-sm mt-1">
                          <span className="text-gray-500">Prix original:</span>
                          <span className="text-right">{negotiation.room.price} €/nuit</span>
                          <span className="text-gray-500">Prix négocié:</span>
                          <span className="text-right font-medium">{negotiation.price} €/nuit</span>
                          <span className="text-green-600">Économie:</span>
                          <span className="text-right text-green-600">{savingsPercent}% ({savings} €)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages informatifs selon le statut */}
                  {negotiation.status === 'ACCEPTED' && (
                    <div className="mt-3 bg-green-50 p-3 rounded-md border border-green-200 text-green-700 text-sm">
                      <p className="font-medium">Félicitations !</p>
                      <p>Votre proposition de prix a été acceptée.</p>
                    </div>
                  )}

                  {negotiation.status === 'COUNTER_OFFER' && (
                    <div className="mt-3 bg-blue-50 p-3 rounded-md border border-blue-200 text-blue-700 text-sm">
                      <p className="font-medium">Contre-proposition</p>
                      <p>L'hôtelier vous a fait une contre-proposition.</p>
                    </div>
                  )}

                  {negotiation.status === 'REJECTED' && (
                    <div className="mt-3 bg-red-50 p-3 rounded-md border border-red-200 text-red-700 text-sm">
                      <p className="font-medium">Proposition refusée</p>
                      <p>L'hôtelier a refusé votre proposition de prix.</p>
                    </div>
                  )}

                  {negotiation.status === 'CANCELLED' && (
                    <div className="mt-3 bg-gray-50 p-3 rounded-md border border-gray-200 text-gray-700 text-sm">
                      <p className="font-medium">Négociation annulée</p>
                      <p>Vous avez annulé cette négociation.</p>
                    </div>
                  )}

                  {negotiation.status === 'PENDING' && (
                    <div className="mt-3 bg-yellow-50 p-3 rounded-md border border-yellow-200 text-yellow-700 text-sm">
                      <p className="font-medium">En attente</p>
                      <p>Votre proposition de prix est en attente d'une réponse de l'hôtelier.</p>
                    </div>
                  )}

                  {/* Actions */}

                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Créée le {format(new Date(negotiation.createdAt), "dd/MM/yyyy", { locale: fr })}
                    </span>

                    <div className="flex gap-2">
                      {negotiation.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-sm flex items-center gap-1"
                          onClick={() => cancelNegotiation(negotiation.id)}
                          disabled={cancellingId === negotiation.id}
                        >
                          {cancellingId === negotiation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Annuler
                        </Button>
                      )}

                      {negotiation.status === 'countered' && (
                        <Button
                          size="sm"
                          className="text-sm flex items-center gap-1"
                          onClick={() => router.push(`/negotiations/${negotiation.id}`)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Répondre
                        </Button>
                      )}

                      {negotiation.status === 'accepted' && (
                        <Button
                          size="sm"
                          className="text-sm flex items-center gap-1"
                          onClick={() => router.push('/bookings')}
                        >
                          <ArrowRight className="h-4 w-4" />
                          Voir réservation
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-sm flex items-center gap-1"
                        onClick={() => router.push(`/room/${negotiation.room.id}`)}
                      >
                        <Hotel className="h-4 w-4" />
                        Voir chambre
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}