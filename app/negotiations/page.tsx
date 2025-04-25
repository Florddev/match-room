"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { 
  Calendar, MapPin, Hotel, Clock, CheckCircle, 
  XCircle, HourglassIcon, RefreshCcw, ArrowRight, Loader2, Euro 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
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
              <Card key={negotiation.id} className="overflow-hidden">
                <div className="aspect-video relative">
                  <img src="/hotel.jpg" alt={negotiation.room.name} className="w-full h-full object-cover" />
                  <Badge className={`absolute top-3 right-3 ${status.color} flex items-center gap-1`}>
                    {status.icon}
                    {status.label}
                  </Badge>
                </div>

                <CardHeader>
                  <CardTitle>{negotiation.room.name}</CardTitle>
                  <CardDescription>{negotiation.room.hotel.name}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
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
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-sm text-gray-500">
                        {negotiation.room.hotel.address}, {negotiation.room.hotel.city} {negotiation.room.hotel.zipCode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Euro className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Détails du prix</p>
                      <div className="text-sm text-gray-500">
                        <div className="flex justify-between">
                          <span>Prix original:</span>
                          <span>{negotiation.room.price} €/nuit</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Prix négocié:</span>
                          <span>{negotiation.price} €/nuit</span>
                        </div>
                        <div className="flex justify-between text-green-600 mt-1">
                          <span>Économie:</span>
                          <span>{savingsPercent}% ({savings} €)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {negotiation.status === 'accepted' && (
                    <div className="bg-green-50 p-3 rounded-md border border-green-200 text-green-700 text-sm">
                      <p className="font-medium">Félicitations !</p>
                      <p>Votre proposition de prix a été acceptée. Une réservation a été créée automatiquement.</p>
                    </div>
                  )}

                  {negotiation.status === 'countered' && (
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-blue-700 text-sm">
                      <p className="font-medium">Contre-proposition</p>
                      <p>L'hôtelier vous a fait une contre-proposition à {negotiation.price} € par nuit.</p>
                    </div>
                  )}

                  {negotiation.status === 'rejected' && (
                    <div className="bg-red-50 p-3 rounded-md border border-red-200 text-red-700 text-sm">
                      <p className="font-medium">Proposition refusée</p>
                      <p>L'hôtelier a refusé votre proposition de prix.</p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between items-center border-t pt-4">
                  <div>
                    <p className="text-xs text-gray-500">
                      Créée le {format(new Date(negotiation.createdAt), "dd/MM/yyyy", { locale: fr })}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {negotiation.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-sm"
                        onClick={() => cancelNegotiation(negotiation.id)}
                        disabled={cancellingId === negotiation.id}
                      >
                        {cancellingId === negotiation.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-1" />
                        )}
                        Annuler
                      </Button>
                    )}
                    
                    {negotiation.status === 'countered' && (
                      <Button
                        size="sm"
                        className="text-sm"
                        onClick={() => router.push(`/negotiations/${negotiation.id}`)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Répondre
                      </Button>
                    )}
                    
                    {negotiation.status === 'accepted' && (
                      <Button
                        size="sm"
                        className="text-sm"
                        onClick={() => router.push('/bookings')}
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Voir réservation
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-sm"
                      onClick={() => router.push(`/room/${negotiation.room.id}`)}
                    >
                      <Hotel className="h-4 w-4 mr-1" />
                      Voir chambre
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}