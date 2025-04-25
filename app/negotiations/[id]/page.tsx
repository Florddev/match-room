"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format, differenceInDays } from "date-fns"
import { fr } from "date-fns/locale"
import { 
  Calendar, MapPin, Hotel, ArrowLeft, Euro, 
  CheckCircle, XCircle, RefreshCcw, Loader2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Negotiation = {
  id: string
  price: number
  status: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  userId: string
  roomId: string
  user: {
    id: string
    firstname: string
    lastname: string
    email: string
  }
  room: {
    id: string
    name: string
    price: number
    content: string
    hotel: {
      id: string
      name: string
      address: string
      city: string
      zipCode: string
    }
  }
}

export default function NegotiationDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const negotiationId = params.id
  
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [actionSuccess, setActionSuccess] = useState(false)

  useEffect(() => {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (user === null) {
      router.push(`/auth/login?redirect=/negotiations/${negotiationId}`)
      return
    }
    
    fetchNegotiation()
  }, [user, router, negotiationId])

  const fetchNegotiation = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/negotiations/${negotiationId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Impossible de récupérer les détails de la négociation")
      }

      const data = await response.json()
      setNegotiation(data)
    } catch (err) {
      console.error("Erreur lors de la récupération de la négociation:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  const acceptCounterOffer = async () => {
    if (!negotiation || negotiation.status !== 'countered') return

    try {
      setIsAccepting(true)
      
      // Créer une réservation avec le prix négocié
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: negotiation.roomId,
          startDate: negotiation.startDate,
          endDate: negotiation.endDate,
          price: negotiation.price,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Échec de la réservation")
      }

      // Mettre à jour le statut de la négociation
      const updateResponse = await fetch(`/api/negotiations/${negotiationId}/accept-counter`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!updateResponse.ok) {
        throw new Error("Échec de la mise à jour du statut de la négociation")
      }

      setActionSuccess(true)
      toast("Contre-offre acceptée", {
        description: "Votre réservation a été créée avec succès au prix négocié!"
      })

      // Rediriger vers la page des réservations après 2 secondes
      setTimeout(() => {
        router.push("/bookings")
      }, 2000)
    } catch (err) {
      console.error("Erreur lors de l'acceptation de la contre-offre:", err)
      toast("Erreur", {
        description: err instanceof Error ? err.message : "Une erreur est survenue"
      })
    } finally {
      setIsAccepting(false)
    }
  }

  const rejectCounterOffer = async () => {
    if (!negotiation || negotiation.status !== 'countered') return

    try {
      setIsRejecting(true)
      const response = await fetch(`/api/negotiations/${negotiationId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Échec de l'annulation")
      }

      setActionSuccess(true)
      toast("Contre-offre refusée", {
        description: "Vous avez refusé la contre-offre de l'hôtelier"
      })

      // Rediriger vers la page des négociations après 2 secondes
      setTimeout(() => {
        router.push("/negotiations")
      }, 2000)
    } catch (err) {
      console.error("Erreur lors du refus de la contre-offre:", err)
      toast("Erreur", {
        description: err instanceof Error ? err.message : "Une erreur est survenue"
      })
    } finally {
      setIsRejecting(false)
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
          icon: <RefreshCcw className="h-4 w-4 mr-1" />,
          color: "bg-amber-100 text-amber-800 border-amber-200"
        }
      case 'accepted':
        return { 
          label: "Acceptée", 
          icon: <CheckCircle className="h-4 w-4 mr-1" />,
          color: "bg-green-100 text-green-800 border-green-200"
        }
      case 'rejected':
        return { 
          label: "Refusée", 
          icon: <XCircle className="h-4 w-4 mr-1" />,
          color: "bg-red-100 text-red-800 border-red-200"
        }
      case 'countered':
        return { 
          label: "Contre-offre", 
          icon: <RefreshCcw className="h-4 w-4 mr-1" />,
          color: "bg-blue-100 text-blue-800 border-blue-200"
        }
      case 'cancelled':
        return { 
          label: "Annulée", 
          icon: <XCircle className="h-4 w-4 mr-1" />,
          color: "bg-gray-100 text-gray-800 border-gray-200"
        }
      default:
        return { 
          label: status, 
          icon: null,
          color: "bg-gray-100 text-gray-800 border-gray-200"
        }
    }
  }

  // Calculate savings or additional cost compared to original price
  const calculatePriceDifference = (negotiation: Negotiation) => {
    const duration = calculateDuration(negotiation.startDate, negotiation.endDate)
    const originalTotal = negotiation.room.price * duration
    const negotiatedTotal = negotiation.price * duration
    const difference = originalTotal - negotiatedTotal
    const percentDifference = Math.round((difference / originalTotal) * 100)
    
    return {
      originalTotal,
      negotiatedTotal,
      difference,
      percentDifference,
      isDiscount: difference > 0
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-lg text-gray-600">Chargement des détails de la négociation...</p>
        </div>
      </div>
    )
  }

  if (error || !negotiation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-lg px-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-700 mb-6">{error || "Négociation introuvable"}</p>
          <Button onClick={() => router.push("/negotiations")} className="bg-primary hover:bg-primary/90">
            Retour aux négociations
          </Button>
        </div>
      </div>
    )
  }

  const status = getStatusBadge(negotiation.status)
  const duration = calculateDuration(negotiation.startDate, negotiation.endDate)
  const { originalTotal, negotiatedTotal, difference, percentDifference, isDiscount } = calculatePriceDifference(negotiation)

  return (
    <div className="container mx-auto py-10 px-4">
      {/* En-tête avec bouton retour */}
      <div className="mb-6">
        <Link href="/negotiations" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux négociations
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Détails de la négociation</h1>
          <Badge className={`${status.color} flex items-center gap-1`}>
            {status.icon}
            {status.label}
          </Badge>
        </div>
        <p className="text-gray-500">
          Proposition de prix pour {negotiation.room.name} à {negotiation.room.hotel.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Détails de la négociation */}
        <div className="lg:col-span-2 space-y-8">
          {/* Chambre */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <img 
                    src="/hotel.jpg" 
                    alt={negotiation.room.name} 
                    className="w-full h-auto rounded-lg object-cover aspect-video" 
                  />
                </div>
                <div className="md:w-2/3">
                  <h2 className="text-xl font-bold mb-2">{negotiation.room.name}</h2>
                  <p className="text-gray-600 mb-4">{negotiation.room.hotel.name}</p>
                  <p className="text-gray-700 line-clamp-3">{negotiation.room.content}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => router.push(`/room/${negotiation.room.id}`)}
                  >
                    <Hotel className="mr-2 h-4 w-4" />
                    Voir la chambre
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Détails du séjour */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <h3 className="text-lg font-medium mb-4">Détails du séjour</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Dates</p>
                    <p className="text-gray-600">
                      Du {formatDate(negotiation.startDate)} au {formatDate(negotiation.endDate)}
                    </p>
                    <p className="text-gray-600">{duration} nuit{duration > 1 ? "s" : ""}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Adresse</p>
                    <p className="text-gray-600">
                      {negotiation.room.hotel.address}<br />
                      {negotiation.room.hotel.city}, {negotiation.room.hotel.zipCode}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Historique de la négociation */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Historique de la négociation</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Euro className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-medium">Prix initial de la chambre</p>
                    <p className="text-lg font-bold">{negotiation.room.price} € <span className="text-sm font-normal text-gray-500">/ nuit</span></p>
                    <p className="text-gray-500 text-sm">
                      Prix total pour {duration} nuit{duration > 1 ? "s" : ""}: {originalTotal} €
                    </p>
                  </div>
                </div>
                
                {negotiation.status === 'pending' && (
                  <div className="flex items-start gap-3 pb-4">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <Euro className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="font-medium">Votre proposition</p>
                      <p className="text-lg font-bold">{negotiation.price} € <span className="text-sm font-normal text-gray-500">/ nuit</span></p>
                      <p className="text-gray-500 text-sm">
                        Économie: {difference} € ({percentDifference}% de réduction)
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        En attente de réponse de l'hôtelier
                      </p>
                    </div>
                  </div>
                )}
                
                {negotiation.status === 'countered' && (
                  <>
                    <div className="flex items-start gap-3 pb-4 border-b">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <Euro className="h-5 w-5 text-gray-700" />
                      </div>
                      <div>
                        <p className="font-medium">Votre proposition initiale</p>
                        <p className="text-gray-700">Proposition refusée par l'hôtelier</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Euro className="h-5 w-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="font-medium">Contre-proposition de l'hôtelier</p>
                        <p className="text-lg font-bold">{negotiation.price} € <span className="text-sm font-normal text-gray-500">/ nuit</span></p>
                        {isDiscount ? (
                          <p className="text-green-600 text-sm">
                            Économie: {difference} € ({percentDifference}% de réduction)
                          </p>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            Prix ajusté: {Math.abs(percentDifference)}% {isDiscount ? "réduction" : "augmentation"}
                          </p>
                        )}
                        <p className="text-sm text-blue-700 mt-1">
                          En attente de votre réponse
                        </p>
                      </div>
                    </div>
                  </>
                )}
                
                {negotiation.status === 'accepted' && (
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <CheckCircle className="h-5 w-5 text-green-700" />
                    </div>
                    <div>
                      <p className="font-medium">Proposition acceptée</p>
                      <p className="text-lg font-bold">{negotiation.price} € <span className="text-sm font-normal text-gray-500">/ nuit</span></p>
                      <p className="text-green-600 text-sm">
                        Économie: {difference} € ({percentDifference}% de réduction)
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Une réservation a été créée à ce prix
                      </p>
                    </div>
                  </div>
                )}
                
                {negotiation.status === 'rejected' && (
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <XCircle className="h-5 w-5 text-red-700" />
                    </div>
                    <div>
                      <p className="font-medium">Proposition refusée</p>
                      <p className="text-gray-600">
                        L'hôtelier n'a pas accepté votre proposition de prix.
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Vous pouvez faire une nouvelle proposition si vous le souhaitez.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Actions */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Résumé de la négociation */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Résumé</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prix original</span>
                    <span>{negotiation.room.price} €/nuit</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>{negotiation.status === 'countered' ? "Contre-offre" : "Prix négocié"}</span>
                    <span>{negotiation.price} €/nuit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durée du séjour</span>
                    <span>{duration} nuit{duration > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-3 border-t">
                    <span>Total</span>
                    <span>{negotiatedTotal} €</span>
                  </div>
                  {isDiscount && (
                    <div className="flex justify-between text-green-600">
                      <span>Économie</span>
                      <span>{difference} € ({percentDifference}%)</span>
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-gray-500 mt-2">
                  Négociation créée le {format(new Date(negotiation.createdAt), "dd/MM/yyyy", { locale: fr })}
                </div>
              </CardContent>
            </Card>
            
            {/* Actions pour les contre-offres */}
            {negotiation.status === 'countered' && (
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <RefreshCcw className="h-4 w-4 text-blue-700" />
                  <AlertTitle className="text-blue-700">Contre-offre reçue</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    L'hôtelier vous propose un prix de {negotiation.price} € par nuit.
                    Acceptez-vous cette proposition ?
                  </AlertDescription>
                </Alert>
                
                {actionSuccess ? (
                  <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Action effectuée avec succès
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={rejectCounterOffer}
                      disabled={isRejecting || isAccepting}
                    >
                      {isRejecting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Refuser
                    </Button>
                    <Button 
                      className="w-full"
                      onClick={acceptCounterOffer}
                      disabled={isAccepting || isRejecting}
                    >
                      {isAccepting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Accepter
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Actions pour les négociations acceptées */}
            {negotiation.status === 'accepted' && (
              <Button 
                className="w-full"
                onClick={() => router.push("/bookings")}
              >
                Voir ma réservation
              </Button>
            )}
            
            {/* Actions pour les négociations refusées */}
            {negotiation.status === 'rejected' && (
              <Button 
                className="w-full"
                onClick={() => router.push(`/room/${negotiation.room.id}`)}
              >
                Voir la chambre
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}