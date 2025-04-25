"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format, differenceInDays } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Calendar, User, Hotel, Euro, CheckCircle, XCircle, 
  RefreshCcw, Loader2, ArrowLeft, Filter
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import Link from "next/link"

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
  }
}

export default function HotelNegotiationsPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const hotelId = params.id
  
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [filteredNegotiations, setFilteredNegotiations] = useState<Negotiation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // État pour la dialogue de contre-offre
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null)
  const [showCounterOfferDialog, setShowCounterOfferDialog] = useState(false)
  const [counterOfferPrice, setCounterOfferPrice] = useState<number>(0)
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false)
  const [actionSuccess, setActionSuccess] = useState(false)

  // Charger les négociations
  useEffect(() => {
    if (user === null) {
      router.push("/auth/login?redirect=/dashboard/hotels/" + hotelId + "/negotiations")
      return
    }
    
    fetchNegotiations()
  }, [user, router, hotelId])

  // Filtrer les négociations lorsque le filtre change
  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredNegotiations(negotiations)
    } else {
      setFilteredNegotiations(negotiations.filter(neg => neg.status === statusFilter))
    }
  }, [statusFilter, negotiations])

  const fetchNegotiations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/hotels/${hotelId}/negotiations`, {
        headers: { "Content-Type": "application/json" }
      })

      if (!response.ok) {
        throw new Error("Impossible de récupérer les négociations")
      }

      const data = await response.json()
      setNegotiations(data)
      setFilteredNegotiations(data)
    } catch (err) {
      console.error("Erreur lors de la récupération des négociations:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  // Ouvrir la boîte de dialogue de contre-offre
  const openCounterOfferDialog = (negotiation: Negotiation) => {
    setSelectedNegotiation(negotiation)
    // Définir un prix initial pour la contre-offre (entre le prix proposé et le prix original)
    const initialCounterPrice = Math.round((negotiation.price + negotiation.room.price) / 2)
    setCounterOfferPrice(initialCounterPrice)
    setShowCounterOfferDialog(true)
    setActionSuccess(false)
  }

  // Définir les bornes min et max pour le slider de contre-offre
  const getCounterOfferBounds = () => {
    if (!selectedNegotiation) return { min: 0, max: 0 }
    
    // Minimum: Le prix proposé par le client
    const min = selectedNegotiation.price
    // Maximum: Le prix original de la chambre
    const max = selectedNegotiation.room.price
    
    return { min, max }
  }

  // Accepter une négociation
  const acceptNegotiation = async (negotiationId: string) => {
    try {
      setIsSubmittingResponse(true)
      const response = await fetch(`/api/negotiations/${negotiationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Échec de l'acceptation")
      }

      // Mettre à jour la liste des négociations
      setNegotiations(negotiations.map(neg => 
        neg.id === negotiationId ? { ...neg, status: "accepted" } : neg
      ))
      
      toast("Négociation acceptée", {
        description: "Une réservation a été créée automatiquement"
      })
      
      setActionSuccess(true)
    } catch (err) {
      console.error("Erreur lors de l'acceptation de la négociation:", err)
      toast("Erreur", {
        description: err instanceof Error ? err.message : "Une erreur est survenue"
      })
    } finally {
      setIsSubmittingResponse(false)
    }
  }

  // Refuser une négociation
  const rejectNegotiation = async (negotiationId: string) => {
    try {
      setIsSubmittingResponse(true)
      const response = await fetch(`/api/negotiations/${negotiationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Échec du refus")
      }

      // Mettre à jour la liste des négociations
      setNegotiations(negotiations.map(neg => 
        neg.id === negotiationId ? { ...neg, status: "rejected" } : neg
      ))
      
      toast("Négociation refusée", {
        description: "La proposition a été refusée"
      })
      
      setActionSuccess(true)
    } catch (err) {
      console.error("Erreur lors du refus de la négociation:", err)
      toast("Erreur", {
        description: err instanceof Error ? err.message : "Une erreur est survenue"
      })
    } finally {
      setIsSubmittingResponse(false)
    }
  }

  // Envoyer une contre-offre
  const submitCounterOffer = async () => {
    if (!selectedNegotiation) return

    try {
      setIsSubmittingResponse(true)
      const response = await fetch(`/api/negotiations/${selectedNegotiation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "countered",
          counterPrice: counterOfferPrice
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Échec de la contre-offre")
      }

      // Mettre à jour la liste des négociations
      setNegotiations(negotiations.map(neg => 
        neg.id === selectedNegotiation.id 
          ? { ...neg, status: "countered", price: counterOfferPrice } 
          : neg
      ))
      
      toast("Contre-offre envoyée", {
        description: "Votre contre-proposition a été envoyée au client"
      })
      
      setActionSuccess(true)
      
      // Fermer la boîte de dialogue après 2 secondes
      setTimeout(() => {
        setShowCounterOfferDialog(false)
      }, 2000)
    } catch (err) {
      console.error("Erreur lors de l'envoi de la contre-offre:", err)
      toast("Erreur", {
        description: err instanceof Error ? err.message : "Une erreur est survenue"
      })
    } finally {
      setIsSubmittingResponse(false)
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

  // Récupérer le badge de statut
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

  // Calculer le pourcentage de réduction
  const calculateDiscountPercent = (originalPrice: number, proposedPrice: number) => {
    return Math.round(((originalPrice - proposedPrice) / originalPrice) * 100)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-lg text-gray-600">Chargement des négociations...</p>
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
          <Button onClick={() => router.push(`/dashboard/hotels/${hotelId}`)} className="bg-primary hover:bg-primary/90">
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      {/* En-tête avec bouton retour */}
      <div className="mb-6">
        <Link href={`/dashboard/hotels/${hotelId}`} className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au tableau de bord
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestion des négociations</h1>
        <p className="text-gray-500 mt-2">Gérez les propositions de prix de vos clients</p>
      </div>

      {/* Filtres */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filtrer par statut:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="countered">Contre-offres</SelectItem>
              <SelectItem value="accepted">Acceptées</SelectItem>
              <SelectItem value="rejected">Refusées</SelectItem>
              <SelectItem value="cancelled">Annulées</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button size="sm" variant="outline" onClick={fetchNegotiations}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Onglets pour différentes catégories */}
      <Tabs defaultValue="pending" className="mb-6">
        <TabsList>
          <TabsTrigger value="pending">
            En attente ({negotiations.filter(n => n.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="countered">
            Contre-offres ({negotiations.filter(n => n.status === 'countered').length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Traitées ({negotiations.filter(n => ['accepted', 'rejected', 'cancelled'].includes(n.status)).length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Toutes ({negotiations.length})
          </TabsTrigger>
        </TabsList>
        
        {['pending', 'countered', 'resolved', 'all'].map(tabValue => (
          <TabsContent key={tabValue} value={tabValue} className="mt-6">
            {filteredNegotiations.length === 0 || 
             (tabValue === 'pending' && !filteredNegotiations.some(n => n.status === 'pending')) ||
             (tabValue === 'countered' && !filteredNegotiations.some(n => n.status === 'countered')) ||
             (tabValue === 'resolved' && !filteredNegotiations.some(n => ['accepted', 'rejected', 'cancelled'].includes(n.status))) ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Euro className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Aucune négociation à afficher</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {tabValue === 'pending' 
                    ? "Vous n'avez pas de négociations en attente actuellement."
                    : tabValue === 'countered'
                    ? "Vous n'avez pas de contre-offres en cours."
                    : tabValue === 'resolved'
                    ? "Vous n'avez pas de négociations traitées."
                    : "Aucune négociation n'a été trouvée."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredNegotiations
                  .filter(negotiation => 
                    tabValue === 'pending' ? negotiation.status === 'pending' :
                    tabValue === 'countered' ? negotiation.status === 'countered' :
                    tabValue === 'resolved' ? ['accepted', 'rejected', 'cancelled'].includes(negotiation.status) :
                    true
                  )
                  .map(negotiation => {
                    const status = getStatusBadge(negotiation.status)
                    const duration = calculateDuration(negotiation.startDate, negotiation.endDate)
                    const discountPercent = calculateDiscountPercent(negotiation.room.price, negotiation.price)
                    
                    return (
                      <Card key={negotiation.id} className={negotiation.status === 'pending' ? "border-amber-300" : ""}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{negotiation.room.name}</CardTitle>
                            <Badge className={`${status.color} flex items-center gap-1`}>
                              {status.icon}
                              {status.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pb-4 space-y-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <div className="flex items-center text-sm text-gray-500 mb-1">
                                <User className="h-4 w-4 mr-1" />
                                <span>Client:</span>
                              </div>
                              <p className="font-medium">
                                {negotiation.user.firstname} {negotiation.user.lastname}
                              </p>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center text-sm text-gray-500 mb-1">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>Séjour:</span>
                              </div>
                              <p className="font-medium">
                                {format(new Date(negotiation.startDate), "dd/MM/yyyy", { locale: fr })} - {format(new Date(negotiation.endDate), "dd/MM/yyyy", { locale: fr })}
                              </p>
                              <p className="text-xs text-gray-500">
                                ({duration} nuit{duration > 1 ? "s" : ""})
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-md">
                            <div>
                              <p className="text-xs text-gray-500">Prix chambre</p>
                              <p className="font-medium">{negotiation.room.price} €</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Prix proposé</p>
                              <p className="font-medium">{negotiation.price} €</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Réduction</p>
                              <p className="font-medium text-amber-700">{discountPercent}%</p>
                            </div>
                          </div>
                          
                          {negotiation.status === 'pending' && (
                            <div className="text-sm text-amber-700 flex items-center">
                              <RefreshCcw className="h-4 w-4 mr-1" />
                              <span>En attente de votre réponse</span>
                            </div>
                          )}
                          
                          {negotiation.status === 'countered' && (
                            <div className="text-sm text-blue-700 flex items-center">
                              <RefreshCcw className="h-4 w-4 mr-1" />
                              <span>En attente de la réponse du client</span>
                            </div>
                          )}
                          
                          {negotiation.status === 'accepted' && (
                            <div className="text-sm text-green-700 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span>Réservation créée au prix négocié</span>
                            </div>
                          )}
                        </CardContent>
                        
                        <CardFooter className="border-t pt-4">
                          {negotiation.status === 'pending' && (
                            <div className="flex w-full space-x-2">
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => rejectNegotiation(negotiation.id)}
                                disabled={isSubmittingResponse}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Refuser
                              </Button>
                              <Button 
                                variant="outline"
                                className="flex-1"
                                onClick={() => openCounterOfferDialog(negotiation)}
                                disabled={isSubmittingResponse}
                              >
                                <RefreshCcw className="h-4 w-4 mr-1" />
                                Contre-offre
                              </Button>
                              <Button 
                                className="flex-1"
                                onClick={() => acceptNegotiation(negotiation.id)}
                                disabled={isSubmittingResponse}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accepter
                              </Button>
                            </div>
                          )}
                          
                          {['countered', 'accepted', 'rejected', 'cancelled'].includes(negotiation.status) && (
                            <div className="w-full flex justify-end">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.push(`/dashboard/negotiations/${negotiation.id}`)}
                              >
                                Voir les détails
                              </Button>
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    )
                  })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Boîte de dialogue de contre-offre */}
      {selectedNegotiation && (
        <Dialog open={showCounterOfferDialog} onOpenChange={setShowCounterOfferDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Proposer une contre-offre</DialogTitle>
              <DialogDescription>
                Définissez un nouveau prix pour répondre à la proposition du client
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-6">
              <div className="space-y-1">
                <h3 className="font-medium">{selectedNegotiation.room.name}</h3>
                <p className="text-sm text-gray-500">
                  Séjour du {format(new Date(selectedNegotiation.startDate), "dd/MM/yyyy", { locale: fr })} au {format(new Date(selectedNegotiation.endDate), "dd/MM/yyyy", { locale: fr })}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Prix original</p>
                  <p className="font-medium">{selectedNegotiation.room.price} €</p>
                </div>
                <div>
                  <p className="text-gray-500">Prix proposé par le client</p>
                  <p className="font-medium">{selectedNegotiation.price} €</p>
                  <p className="text-xs text-amber-700">
                    -{calculateDiscountPercent(selectedNegotiation.room.price, selectedNegotiation.price)}% 
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Votre contre-offre:</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={counterOfferPrice}
                      onChange={(e) => {
                        const bounds = getCounterOfferBounds()
                        const value = parseInt(e.target.value)
                        if (!isNaN(value)) {
                          setCounterOfferPrice(
                            Math.min(Math.max(value, bounds.min), bounds.max)
                          )
                        }
                      }}
                      className="w-24 text-right"
                    />
                    <span>€</span>
                  </div>
                </div>

                <Slider
                  value={[counterOfferPrice]}
                  min={getCounterOfferBounds().min}
                  max={getCounterOfferBounds().max}
                  step={1}
                  onValueChange={(value) => setCounterOfferPrice(value[0])}
                  className="my-4"
                />

                <div className="flex justify-between text-sm text-gray-500">
                  <span>Min: {getCounterOfferBounds().min} €</span>
                  <span>Max: {getCounterOfferBounds().max} €</span>
                </div>
                
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  <p>
                    <strong>Réduction proposée:</strong> {calculateDiscountPercent(selectedNegotiation.room.price, counterOfferPrice)}% 
                    (par rapport au prix original)
                  </p>
                  <p className="mt-1">
                    <strong>Différence client:</strong> {calculateDiscountPercent(selectedNegotiation.price, counterOfferPrice) * -1}% 
                    (par rapport à la proposition du client)
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="sm:justify-between">
              <DialogClose asChild>
                <Button variant="outline" disabled={isSubmittingResponse || actionSuccess}>
                  Annuler
                </Button>
              </DialogClose>
              <Button 
                onClick={submitCounterOffer} 
                disabled={isSubmittingResponse || actionSuccess}
                className={actionSuccess ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {isSubmittingResponse ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : actionSuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Contre-offre envoyée
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Envoyer la contre-offre
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}