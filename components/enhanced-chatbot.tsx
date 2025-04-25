"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MessageSquare, Send, X, Loader2 } from "lucide-react"

interface Message {
  id: number
  text: string
  sender: "user" | "bot"
  suggestions?: string[]
}

interface ChatbotProps {
  pageType: "home" | "rooms" | "hotels"
  onSearch: (query: string) => void
  botName?: string
  accentColor?: string
  position?: "bottom-right" | "bottom-left"
  initialMessage?: string
}

export default function EnhancedChatbot({
  pageType,
  onSearch,
  botName = "Assistant",
  accentColor = "#6366f1",
  position = "bottom-right",
  initialMessage = "Bonjour ! Comment puis-je vous aider ?",
}: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [popularDestinations, setPopularDestinations] = useState<string[]>([])
  const [roomTypes, setRoomTypes] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Récupérer les destinations populaires et types de chambres au chargement
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        // Récupérer les destinations populaires
        const destinationsResponse = await fetch("/api/popular-destinations")
        if (destinationsResponse.ok) {
          const destinationsData = await destinationsResponse.json()
          setPopularDestinations(destinationsData.map((d: any) => d.name))
        }

        // Récupérer les types de chambres
        const roomTypesResponse = await fetch("/api/room-types")
        if (roomTypesResponse.ok) {
          const roomTypesData = await roomTypesResponse.json()
          setRoomTypes(roomTypesData.map((r: any) => r.name))
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error)
      }
    }

    fetchSuggestions()
  }, [])

  // Ajouter le message initial du bot
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          text: initialMessage,
          sender: "bot",
          suggestions: ["Destinations populaires", "Types de chambres", "Aide à la recherche"],
        },
      ])
    }
  }, [initialMessage, messages.length])

  // Faire défiler vers le bas lorsque de nouveaux messages sont ajoutés
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const toggleChatbot = () => {
    setIsOpen(!isOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Ajouter le message de l'utilisateur
    const userMessage: Message = {
      id: Date.now(),
      text: input,
      sender: "user",
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simuler une réponse du bot (dans un vrai cas, vous appelleriez une API)
    setTimeout(() => {
      processUserMessage(input)
      setIsTyping(false)
    }, 1000)
  }

  const processUserMessage = (message: string) => {
    const lowerMessage = message.toLowerCase()

    // Vérifier si le message contient des mots-clés liés aux destinations
    if (lowerMessage.includes("destination") || lowerMessage.includes("ville") || lowerMessage.includes("où")) {
      addBotMessage("Voici nos destinations les plus populaires :", popularDestinations)
      return
    }

    // Vérifier si le message contient des mots-clés liés aux types de chambres
    if (lowerMessage.includes("type") || lowerMessage.includes("chambre") || lowerMessage.includes("hébergement")) {
      addBotMessage("Voici les types de chambres disponibles :", roomTypes)
      return
    }

    // Vérifier si le message contient des mots-clés liés à la recherche
    if (lowerMessage.includes("cherche") || lowerMessage.includes("recherche") || lowerMessage.includes("trouve")) {
      // Extraire potentiellement une destination ou un type de chambre du message
      const potentialDestination = popularDestinations.find((dest) => lowerMessage.includes(dest.toLowerCase()))
      const potentialRoomType = roomTypes.find((type) => lowerMessage.includes(type.toLowerCase()))

      if (potentialDestination) {
        addBotMessage(
          `Je peux vous aider à trouver des chambres à ${potentialDestination}. Voulez-vous voir les résultats ?`,
          ["Voir les résultats", "Autres destinations"],
        )
        return
      }

      if (potentialRoomType) {
        addBotMessage(`Je peux vous aider à trouver des ${potentialRoomType}. Voulez-vous voir les résultats ?`, [
          "Voir les résultats",
          "Autres types de chambres",
        ])
        return
      }

      addBotMessage("Que recherchez-vous exactement ? Vous pouvez préciser une destination ou un type de chambre.", [
        "Destinations populaires",
        "Types de chambres",
      ])
      return
    }

    // Réponse par défaut
    addBotMessage("Comment puis-je vous aider dans votre recherche de logement ?", [
      "Destinations populaires",
      "Types de chambres",
      "Aide à la recherche",
    ])
  }

  const addBotMessage = (text: string, suggestions?: string[]) => {
    const botMessage: Message = {
      id: Date.now(),
      text,
      sender: "bot",
      suggestions,
    }
    setMessages((prev) => [...prev, botMessage])
  }

  const handleSuggestionClick = (suggestion: string) => {
    // Ajouter le message de l'utilisateur basé sur la suggestion
    const userMessage: Message = {
      id: Date.now(),
      text: suggestion,
      sender: "user",
    }
    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    // Traiter la suggestion
    setTimeout(() => {
      if (suggestion === "Destinations populaires") {
        addBotMessage("Voici nos destinations les plus populaires :", popularDestinations)
      } else if (suggestion === "Types de chambres") {
        addBotMessage("Voici les types de chambres disponibles :", roomTypes)
      } else if (suggestion === "Aide à la recherche") {
        addBotMessage(
          "Comment puis-je vous aider dans votre recherche ? Vous pouvez me demander des informations sur les destinations, les types de chambres, ou me dire ce que vous recherchez.",
          ["Je cherche une chambre à Paris", "Je veux une suite", "Chambres pour famille"],
        )
      } else if (suggestion === "Voir les résultats") {
        // Extraire la destination ou le type de chambre du contexte de la conversation
        const lastBotMessage = messages.filter((m) => m.sender === "bot").pop()
        if (lastBotMessage) {
          const text = lastBotMessage.text.toLowerCase()
          const destination = popularDestinations.find((dest) => text.includes(dest.toLowerCase()))
          const roomType = roomTypes.find((type) => text.includes(type.toLowerCase()))

          if (destination) {
            addBotMessage(`Je vous redirige vers les résultats pour ${destination}...`)
            setTimeout(() => onSearch(destination), 1000)
          } else if (roomType) {
            addBotMessage(`Je vous redirige vers les résultats pour ${roomType}...`)
            setTimeout(() => onSearch(roomType), 1000)
          } else {
            addBotMessage("Que souhaitez-vous rechercher exactement ?")
          }
        }
      } else if (popularDestinations.includes(suggestion)) {
        addBotMessage(
          `Excellent choix ! ${suggestion} est une destination très prisée. Voulez-vous voir les chambres disponibles à ${suggestion} ?`,
          ["Voir les résultats", "Plus d'informations"],
        )
      } else if (roomTypes.includes(suggestion)) {
        addBotMessage(`Les ${suggestion} sont très confortables. Voulez-vous voir les ${suggestion} disponibles ?`, [
          "Voir les résultats",
          "Plus d'informations",
        ])
      } else if (suggestion.toLowerCase().includes("paris") || suggestion.toLowerCase().includes("cherche")) {
        // Extraire la destination ou le type de la suggestion
        const destination = popularDestinations.find((dest) => suggestion.toLowerCase().includes(dest.toLowerCase()))
        const roomType = roomTypes.find((type) => suggestion.toLowerCase().includes(type.toLowerCase()))

        if (destination) {
          addBotMessage(
            `Je peux vous aider à trouver des chambres à ${destination}. Voulez-vous voir les résultats ?`,
            ["Voir les résultats", "Autres destinations"],
          )
        } else if (roomType) {
          addBotMessage(`Je peux vous aider à trouver des ${roomType}. Voulez-vous voir les résultats ?`, [
            "Voir les résultats",
            "Autres types de chambres",
          ])
        } else {
          addBotMessage(
            "Pourriez-vous préciser votre recherche ? Par exemple, quelle destination vous intéresse ?",
            popularDestinations,
          )
        }
      } else {
        // Traiter d'autres suggestions
        processUserMessage(suggestion)
      }
      setIsTyping(false)
    }, 1000)
  }

  const positionClass = position === "bottom-left" ? "left-4" : "right-4"

  return (
    <>
      {/* Bouton du chatbot */}
      <button
        onClick={toggleChatbot}
        className={`fixed ${positionClass} bottom-4 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-105`}
        style={{ backgroundColor: accentColor }}
        aria-label={isOpen ? "Fermer le chatbot" : "Ouvrir le chatbot"}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
      </button>

      {/* Fenêtre du chatbot */}
      {isOpen && (
        <div
          className={`fixed ${positionClass} bottom-20 z-50 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden border border-gray-200`}
        >
          {/* En-tête du chatbot */}
          <div className="p-4 border-b flex items-center" style={{ backgroundColor: accentColor }}>
            <MessageSquare className="w-6 h-6 text-white mr-2" />
            <h3 className="font-medium text-white">{botName}</h3>
            <button
              onClick={toggleChatbot}
              className="ml-auto text-white hover:text-gray-200"
              aria-label="Fermer le chatbot"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corps du chatbot */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${message.sender === "user" ? "flex justify-end" : "flex justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-primary text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>

                  {/* Suggestions */}
                  {message.sender === "bot" && message.suggestions && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded-full transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Indicateur de frappe */}
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="bg-white p-3 rounded-lg rounded-bl-none shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-1">
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Formulaire de saisie */}
          <form onSubmit={handleSubmit} className="p-3 border-t flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="submit"
              className="p-2 rounded-r-lg"
              style={{ backgroundColor: accentColor }}
              disabled={isTyping}
            >
              {isTyping ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  )
}
