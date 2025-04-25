"use client"

import "leaflet/dist/leaflet.css"
import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

// Types pour les chambres et hôtels
type Hotel = {
  id: string
  name: string
  rate: number
  address: string
  city: string
  zipCode: string
  phone: string
  rooms?: Room[]
}

type Room = {
  id: string
  name: string
  price: number
  rate: number
  content: string
  categories: string
  tags: string
  hotelId: string
}

// Type pour les coordonnées géographiques
type GeoCoordinates = {
  lat: number
  lng: number
}

// Type pour le cache de géocodage
type GeocodingCache = {
  [key: string]: GeoCoordinates
}

interface MapClientComponentProps {
  filteredRooms: Room[]
  hotels: Hotel[]
}

export default function MapClientComponent({ filteredRooms, hotels }: MapClientComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [geocodingCache, setGeocodingCache] = useState<GeocodingCache>({})
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false)
  const [leafletLoaded, setLeafletLoaded] = useState<boolean>(false)
  const [mapInitialized, setMapInitialized] = useState<boolean>(false)
  const [L, setL] = useState<any>(null) // State pour stocker l'instance Leaflet
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null)

  // Fonction pour géocoder une adresse
  const geocodeAddress = async (hotel: Hotel): Promise<GeoCoordinates> => {
    const cacheKey = `${hotel.address}, ${hotel.city}, ${hotel.zipCode}`

    // Vérifier si l'adresse est déjà dans le cache
    if (geocodingCache[cacheKey]) {
      return geocodingCache[cacheKey]
    }

    try {
      // Formater l'adresse pour l'URL
      const query = encodeURIComponent(`${hotel.address}, ${hotel.zipCode} ${hotel.city}`)
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`

      // Ajouter un délai pour respecter les limites de l'API (max 1 requête par seconde)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const response = await fetch(url)
      const data = await response.json()

      if (data && data.length > 0) {
        const coordinates = {
          lat: Number.parseFloat(data[0].lat),
          lng: Number.parseFloat(data[0].lon),
        }

        // Mettre à jour le cache
        setGeocodingCache((prev) => ({
          ...prev,
          [cacheKey]: coordinates,
        }))

        return coordinates
      } else {
        throw new Error("Adresse non trouvée")
      }
    } catch (error) {
      console.error(`Erreur de géocodage pour ${hotel.name}:`, error)
      // Position par défaut (Paris) avec un léger offset aléatoire
      return {
        lat: 48.8566 + (Math.random() * 0.02 - 0.01),
        lng: 2.3522 + (Math.random() * 0.02 - 0.01),
      }
    }
  }

  // Charger Leaflet de manière dynamique
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // Importer Leaflet de manière dynamique
        const leafletModule = await import("leaflet")
        setL(leafletModule.default || leafletModule) // Stocker l'instance Leaflet
        setLeafletLoaded(true)
      } catch (error) {
        console.error("Erreur lors du chargement de Leaflet:", error)
      }
    }

    loadLeaflet()

    // Nettoyage à la destruction du composant
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Effet d'initialisation de la carte - exécuté une fois Leaflet chargé
  useEffect(() => {
    // Ne continuer que si Leaflet est chargé, l'élément DOM existe et la carte n'est pas déjà initialisée
    if (!leafletLoaded || !mapRef.current || !L || mapInstanceRef.current) return

    try {
      console.log("Initializing Leaflet map...")

      // Fix pour les icônes de Leaflet
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      })

      // Créer l'instance de carte
      const map = L.map(mapRef.current, {
        zoomControl: false, // Désactiver les contrôles de zoom par défaut
        attributionControl: false, // Désactiver l'attribution par défaut
      }).setView([48.8566, 2.3522], 12) // Paris comme centre par défaut

      // Ajouter la couche OpenStreetMap avec un style plus moderne
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map)

      // Ajouter les contrôles de zoom dans le coin inférieur droit
      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map)

      // Ajouter l'attribution dans le coin inférieur gauche
      L.control
        .attribution({
          position: "bottomleft",
          prefix: false,
        })
        .addTo(map)

      // Stocker l'instance de map dans la référence
      mapInstanceRef.current = map

      // Indiquer que la carte est initialisée
      setMapInitialized(true)
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la carte:", error)
    }
  }, [leafletLoaded, L]) // Dépendances: leafletLoaded et L

  // Effet de mise à jour des marqueurs - exécuté quand filteredRooms ou hotels change
  useEffect(() => {
    // Ne pas continuer si la carte n'est pas initialisée, pas d'hôtels, pas de Leaflet ou déjà en train de géocoder
    if (
      !mapInitialized ||
      !mapInstanceRef.current ||
      !L ||
      hotels.length === 0 ||
      isGeocoding ||
      filteredRooms.length === 0
    ) {
      return
    }

    // Vérifier que nous avons bien une instance de carte
    const map = mapInstanceRef.current

    // Fonction pour mettre à jour les marqueurs
    async function updateMarkers() {
      setIsGeocoding(true)

      try {
        // Supprimer les marqueurs existants
        markersRef.current.forEach((marker) => marker.remove())
        markersRef.current = []

        // Obtenir les hôtels pertinents
        const filteredHotelIds = new Set(filteredRooms.map((room) => room.hotelId))
        const relevantHotels = hotels.filter((hotel) => filteredHotelIds.has(hotel.id))
        console.log(`Found ${relevantHotels.length} relevant hotels`)

        // Si nous avons des hôtels pertinents, ajuster la vue de la carte
        if (relevantHotels.length > 0) {
          const bounds = L.latLngBounds([])

          // Traiter chaque hôtel
          for (const hotel of relevantHotels) {
            // Obtenir toutes les chambres pour cet hôtel qui sont dans la liste filtrée
            const hotelRooms = filteredRooms.filter((room) => room.hotelId === hotel.id)

            if (hotelRooms.length === 0) continue

            // Obtenir la chambre avec le prix le plus bas pour cet hôtel
            const minPrice = Math.min(...hotelRooms.map((room) => room.price))

            // Obtenir les coordonnées de l'hôtel par géocodage
            const coordinates = await geocodeAddress(hotel)

            // Vérifier que les coordonnées sont valides
            if (isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
              console.error(`Coordonnées invalides pour l'hôtel ${hotel.name}:`, coordinates)
              continue
            }

            try {
              // Créer un marqueur personnalisé avec icône de prix
              const isSelected = selectedHotel === hotel.id
              const priceIcon = L.divIcon({
                className: "custom-price-marker",
                html: `<div style="background-color:${isSelected ? "#FF385C" : "#4f46e5"}; color:white; padding:6px 12px; border-radius:9999px; font-weight:bold; font-size:14px; min-width:60px; text-align:center; box-shadow:0 2px 4px rgba(0,0,0,0.2); transform: ${isSelected ? "scale(1.1)" : "scale(1)"}; transition: transform 0.2s ease;">${minPrice}€</div>`,
                iconSize: [80, 40],
                iconAnchor: [40, 20],
              })

              // Ajouter le marqueur à la carte
              const marker = L.marker([coordinates.lat, coordinates.lng], { icon: priceIcon }).addTo(map)
              markersRef.current.push(marker)

              // Créer une popup avec les détails de l'hôtel
              const popupContent = `
                <div style="max-width: 250px;">
                  <h3 style="font-size: 16px; font-weight: 500; margin-bottom: 5px;">${hotel.name}</h3>
                  <p style="font-size: 14px; color: #666; margin-bottom: 10px;">${hotel.address}, ${hotel.city} ${hotel.zipCode}</p>
                  <p style="font-size: 14px; font-weight: 700; margin-bottom: 5px;">${hotelRooms.length} chambres disponibles</p>
                  <p style="font-size: 14px;">À partir de <span style="font-weight: bold;">${minPrice}€</span> / nuit</p>
                  <div style="display: flex; align-items: center; margin-top: 5px;">
                    <span style="font-size: 14px; margin-right: 5px;">${hotel.rate}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="#FFD700">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  </div>
                </div>
              `

              marker.bindPopup(popupContent)

              // Ajouter un événement au clic sur le marqueur
              marker.on("click", () => {
                setSelectedHotel(hotel.id)
              })

              // Étendre les limites pour inclure ce marqueur
              bounds.extend([coordinates.lat, coordinates.lng])
            } catch (error) {
              console.error(`Erreur lors de l'ajout du marqueur pour ${hotel.name}:`, error)
            }
          }

          // Ajuster la vue de la carte pour afficher tous les marqueurs
          if (bounds.isValid()) {
            try {
              map.fitBounds(bounds, {
                padding: [50, 50],
              })

              // Limiter le niveau de zoom maximum
              if (map.getZoom() > 15) {
                map.setZoom(15)
              }
            } catch (error) {
              console.error("Erreur lors de l'ajustement de la vue de la carte:", error)
            }
          }

          console.log("Map updated with markers")
        }
      } catch (error) {
        console.error("Erreur lors de la mise à jour des marqueurs:", error)
      } finally {
        setIsGeocoding(false)
      }
    }

    // Mettre à jour les marqueurs
    updateMarkers()
  }, [filteredRooms, hotels, mapInitialized, L, isGeocoding, selectedHotel])

  return (
    <>
      <div ref={mapRef} className="h-full w-full" />
      {isGeocoding && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-gray-600">Géocodage des adresses en cours...</p>
          </div>
        </div>
      )}
      <style jsx global>{`
        .custom-price-marker {
          transition: transform 0.2s ease;
        }
        .custom-price-marker:hover {
          transform: scale(1.1);
          z-index: 1000 !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 5px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .leaflet-popup-content {
          margin: 10px 12px;
        }
        .leaflet-popup-tip {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .leaflet-container {
          font-family: "Circular", -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif;
        }
      `}</style>
    </>
  )
}
