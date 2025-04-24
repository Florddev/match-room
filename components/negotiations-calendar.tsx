"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Check, X, MessageCircle, ThumbsUp, ThumbsDown, User, DollarSign, Percent, Calendar, RefreshCw, AlertTriangle } from "lucide-react"
import { format, addDays, differenceInDays, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventClickArg, EventInput } from '@fullcalendar/core'

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

interface NegotiationsCalendarProps {
  hotelId: string
  roomId: string
  originalPrice: number
}

export function NegotiationsCalendar({ hotelId, roomId, originalPrice }: NegotiationsCalendarProps) {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null)
  const [showNegotiationDialog, setShowNegotiationDialog] = useState(false)
  const [counterPrice, setCounterPrice] = useState<number>(0)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek'>('dayGridMonth')
  const calendarRef = useRef<FullCalendar | null>(null)
  const router = useRouter()

  // Fetch negotiations
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

  // Convert negotiations to FullCalendar events
  const calendarEvents = negotiations.map(nego => {
    const start = parseISO(nego.startDate)
    const end = addDays(parseISO(nego.endDate), 1) // Add a day for inclusive display
    
    // Define color based on status
    let backgroundColor, borderColor, textColor
    
    switch (nego.status.toLowerCase()) {
      case 'pending':
        backgroundColor = 'rgba(251, 191, 36, 0.2)' // amber-400 with transparency
        borderColor = 'rgb(251, 191, 36)'
        textColor = 'rgb(120, 53, 15)' // amber-900
        break
      case 'counter':
        backgroundColor = 'rgba(59, 130, 246, 0.2)' // blue-500 with transparency
        borderColor = 'rgb(59, 130, 246)'
        textColor = 'rgb(30, 58, 138)' // blue-900
        break
      case 'accepted':
        backgroundColor = 'rgba(34, 197, 94, 0.2)' // green-500 with transparency
        borderColor = 'rgb(34, 197, 94)'
        textColor = 'rgb(20, 83, 45)' // green-900
        break
      case 'rejected':
        backgroundColor = 'rgba(239, 68, 68, 0.2)' // red-500 with transparency
        borderColor = 'rgb(239, 68, 68)'
        textColor = 'rgb(127, 29, 29)' // red-900
        break
      default:
        backgroundColor = 'rgba(100, 116, 139, 0.2)' // slate-500 with transparency
        borderColor = 'rgb(100, 116, 139)'
        textColor = 'rgb(15, 23, 42)' // slate-900
    }
    
    // Calculate discount percentage
    const discount = ((originalPrice - nego.price) / originalPrice) * 100
    const discountText = discount > 0 ? `-${discount.toFixed(0)}%` : "0%"
    
    // Calculate stay duration
    const stayDuration = differenceInDays(parseISO(nego.endDate), parseISO(nego.startDate)) + 1
    
    return {
      id: nego.id,
      title: `${nego.user.firstname} ${nego.user.lastname} • ${nego.price.toFixed(2)}€ (${discountText})`,
      start,
      end,
      backgroundColor,
      borderColor,
      textColor,
      extendedProps: {
        negotiation: nego,
        discount: discountText,
        stayDuration
      },
      allDay: true
    } as EventInput
  })

  // Handle event click (click on a negotiation in the calendar)
  const handleEventClick = (info: EventClickArg) => {
    const negotiation = info.event.extendedProps.negotiation as Negotiation
    setSelectedNegotiation(negotiation)
    setCounterPrice(negotiation.price)
    setShowNegotiationDialog(true)
  }

  // Calculer le pourcentage de réduction
  const calculateDiscount = (proposedPrice: number) => {
    const discount = ((originalPrice - proposedPrice) / originalPrice) * 100
    return discount > 0 ? discount.toFixed(0) : "0"
  }

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy", { locale: fr })
  }

  // Calculer la durée du séjour en jours
  const calculateStayDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Traiter les actions sur une négociation
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
      
      // Rafraîchir les négociations
      await fetchNegotiations()
      
      // Afficher une notification
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
      
      // Fermer le dialogue
      setShowNegotiationDialog(false)
      setSelectedNegotiation(null)
      
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

  // Toggle calendar view between month and week
  const toggleCalendarView = () => {
    setCalendarView(calendarView === 'dayGridMonth' ? 'timeGridWeek' : 'dayGridMonth')
  }

  // Afficher le chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <RefreshCw className="animate-spin h-5 w-5 mr-2" />
        <span>Chargement des négociations...</span>
      </div>
    )
  }

  // Afficher l'erreur
  if (error) {
    return (
      <div className="flex justify-center items-center p-8 text-red-500">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center text-lg">
                <Calendar className="h-4 w-4 mr-2" />
                Calendrier des négociations
              </CardTitle>
              <CardDescription>
                Visualisez et gérez toutes vos négociations sur le calendrier
              </CardDescription>
            </div>
            {/*
            <Button 
              variant="outline" 
              onClick={toggleCalendarView}
              className="ml-2"
            >
              {calendarView === 'dayGridMonth' ? 'Vue Semaine' : 'Vue Mois'}
            </Button>
            */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[700px]">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={calendarView}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
              }}
              events={calendarEvents}
              eventClick={handleEventClick}
              height="100%"
              locale="fr"
              firstDay={1}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              dayMaxEvents={true}
              eventContent={(eventInfo: any) => {
                const negotiation = eventInfo.event.extendedProps.negotiation as Negotiation
                const discount = eventInfo.event.extendedProps.discount
                const duration = eventInfo.event.extendedProps.stayDuration
                
                return (
                  <div className="p-1 overflow-hidden h-full w-full text-xs">
                    <div className="font-medium">{negotiation.user.firstname} {negotiation.user.lastname}</div>
                    <div className="flex justify-between text-[10px]">
                      <span>{negotiation.price.toFixed(2)}€</span>
                      <Badge variant="outline" className="text-[9px] py-0 h-3.5">{discount}</Badge>
                    </div>
                    <div className="text-[10px] opacity-80">
                      {duration} {duration > 1 ? 'nuits' : 'nuit'}
                    </div>
                  </div>
                )
              }}
            />
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Statuts</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgb(251, 191, 36)' }}></div>
                  <span className="text-xs text-muted-foreground">En attente</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgb(59, 130, 246)' }}></div>
                  <span className="text-xs text-muted-foreground">Contre-proposition</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgb(34, 197, 94)' }}></div>
                  <span className="text-xs text-muted-foreground">Acceptée</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgb(239, 68, 68)' }}></div>
                  <span className="text-xs text-muted-foreground">Refusée</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Interactions</div>
              <div className="text-xs text-muted-foreground">
                <p>Cliquez sur un événement pour gérer la négociation.</p>
                <p>Changez la vue du calendrier pour une visualisation plus détaillée.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogue de détails d'une négociation */}
      <Dialog open={showNegotiationDialog} onOpenChange={setShowNegotiationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la négociation</DialogTitle>
            <DialogDescription>
              Gérer cette demande de négociation
            </DialogDescription>
          </DialogHeader>

          {selectedNegotiation && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Client</h4>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium">{selectedNegotiation.user.firstname} {selectedNegotiation.user.lastname}</p>
                  <p className="text-xs text-muted-foreground">{selectedNegotiation.user.email}</p>
                  <p className="text-xs text-muted-foreground">{selectedNegotiation.user.phone}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Dates du séjour</h4>
                <div className="bg-muted p-3 rounded-md flex justify-between items-center">
                  <div className="text-sm">
                    <p className="font-medium">
                      {formatDate(selectedNegotiation.startDate)} - {formatDate(selectedNegotiation.endDate)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {calculateStayDuration(selectedNegotiation.startDate, selectedNegotiation.endDate)} nuits
                    </p>
                  </div>
                  <Badge>
                    {selectedNegotiation.status.toLowerCase() === "pending" 
                      ? "En attente" 
                      : selectedNegotiation.status.toLowerCase() === "counter"
                      ? "Contre-proposition"
                      : selectedNegotiation.status.toLowerCase() === "accepted"
                      ? "Acceptée"
                      : "Refusée"
                    }
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Prix original</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="font-semibold text-sm">{originalPrice.toFixed(2)} € <span className="text-xs font-normal">/ nuit</span></p>
                    <p className="text-xs text-muted-foreground">
                      {(originalPrice * calculateStayDuration(selectedNegotiation.startDate, selectedNegotiation.endDate)).toFixed(2)} € au total
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Prix proposé</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex items-center">
                      <p className="font-semibold text-sm">{selectedNegotiation.price.toFixed(2)} € <span className="text-xs font-normal">/ nuit</span></p>
                      <Badge variant="outline" className="ml-2 text-xs">-{calculateDiscount(selectedNegotiation.price)}%</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(selectedNegotiation.price * calculateStayDuration(selectedNegotiation.startDate, selectedNegotiation.endDate)).toFixed(2)} € au total
                    </p>
                  </div>
                </div>
              </div>

              {(selectedNegotiation.status.toLowerCase() === "pending" || selectedNegotiation.status.toLowerCase() === "counter") && (
                <>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Contre-proposition</h4>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span>€ / nuit</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Réduction: {counterPrice > 0 ? `${calculateDiscount(counterPrice)}%` : "0%"}</span>
                      <span>Total: {counterPrice > 0 
                        ? `${(counterPrice * calculateStayDuration(selectedNegotiation.startDate, selectedNegotiation.endDate)).toFixed(2)} €` 
                        : "0 €"}
                      </span>
                    </div>
                  </div>

                  <DialogFooter className="flex justify-between">
                    <div className="space-x-2">
                      <Button 
                        variant="default" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleNegotiationAction(selectedNegotiation.id, 'accept')}
                        disabled={!!processingId}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accepter
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        onClick={() => handleNegotiationAction(selectedNegotiation.id, 'counter', counterPrice)}
                        disabled={!counterPrice || !!processingId}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Contre-proposition
                      </Button>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleNegotiationAction(selectedNegotiation.id, 'reject')}
                      disabled={!!processingId}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Refuser
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}