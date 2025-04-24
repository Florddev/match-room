"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Check, 
  X, 
  Tag, 
  Clock, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Calendar,
  RefreshCw,
  AlertTriangle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type NegotiationUser = {
  id: string
  firstname: string
  lastname: string
  email: string
  phone: string
}

type Negotiation = {
  id: string
  userId: string
  roomId: string
  status: string
  price: number
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  user: NegotiationUser
}

interface NegotiationsListProps {
  hotelId: string
  roomId: string
  originalPrice: number
}

export function NegotiationsList({ hotelId, roomId, originalPrice }: NegotiationsListProps) {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [counterPrice, setCounterPrice] = useState<number>(0)
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const router = useRouter()

  // Récupérer les négociations
  const fetchNegotiations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/hotels/${hotelId}/rooms/${roomId}/negotiations`)
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des négociations")
      }
      
      const data = await response.json()
      setNegotiations(data.negotiations)
    } catch (err) {
      console.error("Erreur:", err)
      setError("Impossible de charger les négociations")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hotelId && roomId) {
      fetchNegotiations()
    }
  }, [hotelId, roomId])

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  }

  // Calculer la durée du séjour en jours
  const calculateStayDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Calculer le pourcentage de réduction
  const calculateDiscount = (proposedPrice: number) => {
    const discount = ((originalPrice - proposedPrice) / originalPrice) * 100
    return discount > 0 ? discount.toFixed(0) : "0"
  }

  // Gérer les actions sur les négociations
  const handleNegotiationAction = async (negotiationId: string, action: 'accept' | 'reject' | 'counter', price?: number) => {
    try {
      setProcessingId(negotiationId)
      const payload: any = { action }
      
      if (action === 'counter' && price) {
        payload.price = price
      }
      
      const response = await fetch(`/api/dashboard/hotels/${hotelId}/rooms/${roomId}/negotiations/${negotiationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        throw new Error("Erreur lors du traitement de la négociation")
      }
      
      // Actualiser les négociations
      await fetchNegotiations()
      
      // Afficher une notification en fonction de l'action
      const messages = {
        accept: "Négociation acceptée avec succès",
        reject: "Négociation refusée",
        counter: "Contre-proposition envoyée avec succès",
      }
      
      toast(messages[action], {
        description: action === 'accept' 
          ? "Le client sera notifié de votre acceptation."
          : action === 'reject'
          ? "Le client sera notifié de votre refus."
          : "Le client recevra votre contre-proposition.",
      })
      
      // Fermer le dialogue si ouvert
      setOpenDialog(false)
      setSelectedNegotiation(null)
      
      // Rafraîchir la page pour mettre à jour les données
      router.refresh()
    } catch (error) {
      console.error("Erreur:", error)
      toast("Erreur", {
        description: "Une erreur s'est produite lors du traitement de la négociation.",
      })
    } finally {
      setProcessingId(null)
    }
  }

  // Ouvrir le dialogue de contre-proposition
  const openCounterDialog = (negotiation: Negotiation) => {
    setSelectedNegotiation(negotiation)
    setCounterPrice(negotiation.price) // Initialiser avec le prix proposé
    setOpenDialog(true)
  }

  // Afficher un état de chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin mr-2">
          <RefreshCw className="h-5 w-5" />
        </div>
        <span>Chargement des négociations...</span>
      </div>
    )
  }

  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <div className="flex justify-center items-center p-8 text-red-500">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span>{error}</span>
      </div>
    )
  }

  // Afficher un message si aucune négociation n'est trouvée
  if (negotiations.length === 0) {
    return (
      <Card className="col-span-full p-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-2">
          <Tag className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-lg font-medium">Aucune négociation en cours</h3>
          <p className="text-sm text-muted-foreground">
            Il n'y a actuellement aucune demande de négociation pour cette chambre.
          </p>
        </div>
      </Card>
    )
  }

  // Afficher la liste des négociations
  return (
    <div className="space-y-4">
      {/* Dialogue de contre-proposition */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Faire une contre-proposition</DialogTitle>
            <DialogDescription>
              Proposez un nouveau prix pour cette réservation.
            </DialogDescription>
          </DialogHeader>
          
          {selectedNegotiation && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientInfo">Client</Label>
                  <p id="clientInfo" className="text-sm">
                    {selectedNegotiation.user.firstname} {selectedNegotiation.user.lastname}
                  </p>
                </div>
                <div>
                  <Label htmlFor="dates">Dates</Label>
                  <p id="dates" className="text-sm">
                    {formatDate(selectedNegotiation.startDate)} au {formatDate(selectedNegotiation.endDate)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="originalPrice">Prix initial</Label>
                  <p id="originalPrice" className="text-sm font-medium">
                    {originalPrice.toFixed(2)} € / nuit
                  </p>
                </div>
                <div>
                  <Label htmlFor="clientPrice">Prix proposé</Label>
                  <p id="clientPrice" className="text-sm">
                    {selectedNegotiation.price.toFixed(2)} € / nuit
                  </p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="counterPrice">Votre contre-proposition</Label>
                <div className="flex items-center mt-1">
                  <Input
                    id="counterPrice"
                    type="number"
                    min={0}
                    step="0.01"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="ml-2">€ / nuit</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {counterPrice > 0 && `Réduction de ${calculateDiscount(counterPrice)}% par rapport au prix initial.`}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => selectedNegotiation && handleNegotiationAction(selectedNegotiation.id, 'counter', counterPrice)}
              disabled={!counterPrice || processingId === selectedNegotiation?.id}
            >
              {processingId === selectedNegotiation?.id ? "Envoi en cours..." : "Envoyer la contre-proposition"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Liste des négociations */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {negotiations.map((negotiation) => {
          const isActive = negotiation.status.toLowerCase() === "pending" || negotiation.status.toLowerCase() === "counter"
          const stayDuration = calculateStayDuration(negotiation.startDate, negotiation.endDate)
          const totalOriginalPrice = originalPrice * stayDuration
          const totalProposedPrice = negotiation.price * stayDuration
          const discount = calculateDiscount(negotiation.price)
          
          return (
            <Card 
              key={negotiation.id} 
              className={`overflow-hidden ${
                negotiation.status === "accepted" 
                  ? "border-green-200 bg-green-50" 
                  : negotiation.status === "rejected" 
                  ? "border-red-200 bg-red-50" 
                  : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <div className="flex items-center">
                      {negotiation.status === "pending" && <Clock className="h-4 w-4 mr-2 text-amber-500" />}
                      {negotiation.status === "counter" && <MessageCircle className="h-4 w-4 mr-2 text-blue-500" />}
                      {negotiation.status === "accepted" && <ThumbsUp className="h-4 w-4 mr-2 text-green-500" />}
                      {negotiation.status === "rejected" && <ThumbsDown className="h-4 w-4 mr-2 text-red-500" />}
                      
                      {negotiation.user.firstname} {negotiation.user.lastname}
                    </div>
                    {isActive && negotiation.status === "pending" && 
                      <Badge className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-100">En attente</Badge>}
                    {isActive && negotiation.status === "counter" && 
                      <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">Contre-proposition</Badge>}
                    {negotiation.status === "accepted" && 
                      <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">Acceptée</Badge>}
                    {negotiation.status === "rejected" && 
                      <Badge className="ml-2 bg-red-100 text-red-800 hover:bg-red-100">Refusée</Badge>}
                  </CardTitle>
                </div>
                <CardDescription className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(negotiation.startDate)} au {formatDate(negotiation.endDate)} ({stayDuration} {stayDuration > 1 ? 'nuits' : 'nuit'})
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Prix original</p>
                    <p className="text-lg font-semibold">{originalPrice.toFixed(2)} € <span className="text-xs font-normal">/ nuit</span></p>
                    <p className="text-xs text-muted-foreground">{totalOriginalPrice.toFixed(2)} € au total</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prix proposé</p>
                    <p className="text-lg font-semibold">
                      {negotiation.price.toFixed(2)} € <span className="text-xs font-normal">/ nuit</span>
                      <Badge variant="outline" className="ml-2 text-xs">-{discount}%</Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">{totalProposedPrice.toFixed(2)} € au total</p>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-2">
                  {negotiation.status === "counter" ? "Contre-proposition envoyée" : "Proposition du client"}
                  <span className="ml-2">• {new Date(negotiation.updatedAt).toLocaleString()}</span>
                </div>
              </CardContent>
              
              {isActive && (
                <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-3">
                  <div className="space-x-2">
                    <Button 
                      size="sm" 
                      variant="default" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleNegotiationAction(negotiation.id, 'accept')}
                      disabled={processingId === negotiation.id}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accepter
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      onClick={() => openCounterDialog(negotiation)}
                      disabled={processingId === negotiation.id}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Contre-proposition
                    </Button>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleNegotiationAction(negotiation.id, 'reject')}
                    disabled={processingId === negotiation.id}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Refuser
                  </Button>
                </CardFooter>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}