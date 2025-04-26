"use client"

import "leaflet/dist/leaflet.css"
import { Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

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
  hotel?: Hotel
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
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  // Détermine automatiquement le mode d'affichage en fonction des données
  // Si nous avons des chambres, nous les affichons, sinon nous affichons les hôtels
  const [displayMode, setDisplayMode] = useState<'rooms' | 'hotels'>('hotels')

  // Mettre à jour le mode d'affichage en fonction des données disponibles
  useEffect(() => {
    if (filteredRooms && filteredRooms.length > 0) {
      setDisplayMode('rooms');
    } else {
      setDisplayMode('hotels');
    }
  }, [filteredRooms]);

  // Fonction pour géocoder une adresse
  const geocodeAddress = async (address: string, city: string, zipCode: string): Promise<GeoCoordinates> => {
    const cacheKey = `${address}, ${city}, ${zipCode}`

    // Vérifier si l'adresse est déjà dans le cache
    if (geocodingCache[cacheKey]) {
      return geocodingCache[cacheKey]
    }

    try {
      // Formater l'adresse pour l'URL
      const query = encodeURIComponent(`${address}, ${zipCode} ${city}`)
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
      console.error(`Erreur de géocodage pour ${address}:`, error)
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

      // N'ajouter le bouton de changement de mode que si nous avons les deux types de données
      // et que nous sommes sur la page hôtels (pas sur la page chambres)
      if (filteredRooms.length > 0 && hotels.length > 0 && window.location.pathname.includes("/hotels")) {
        // Ajouter un contrôle personnalisé pour basculer entre chambres/hôtels
        const customControl = L.control({ position: 'topright' });
        customControl.onAdd = function () {
          const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
          div.innerHTML = `
            <div class="bg-white rounded-md shadow-md p-2 flex flex-col gap-1">
              <button class="px-3 py-1 text-xs rounded-md ${displayMode === 'hotels' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}" id="toggle-hotels">Hôtels</button>
              <button class="px-3 py-1 text-xs rounded-md ${displayMode === 'rooms' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}" id="toggle-rooms">Chambres</button>
            </div>
          `;

          // Ajouter les événements
          setTimeout(() => {
            const hotelsBtn = document.getElementById('toggle-hotels');
            const roomsBtn = document.getElementById('toggle-rooms');

            if (hotelsBtn) hotelsBtn.addEventListener('click', () => setDisplayMode('hotels'));
            if (roomsBtn) roomsBtn.addEventListener('click', () => setDisplayMode('rooms'));
          }, 100);

          return div;
        };
        customControl.addTo(map);
      }

      // Stocker l'instance de map dans la référence
      mapInstanceRef.current = map

      // Indiquer que la carte est initialisée
      setMapInitialized(true)
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la carte:", error)
    }
  }, [leafletLoaded, L, displayMode, filteredRooms.length, hotels.length]) // Dépendances: leafletLoaded, L, displayMode, et la présence de données

  // Effet de mise à jour des marqueurs - exécuté quand filteredRooms, hotels ou displayMode change
  useEffect(() => {
    // Ne pas continuer si la carte n'est pas initialisée, pas d'hôtels, pas de Leaflet ou déjà en train de géocoder
    if (
      !mapInitialized ||
      !mapInstanceRef.current ||
      !L ||
      isGeocoding ||
      (hotels.length === 0 && filteredRooms.length === 0)
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

        const bounds = L.latLngBounds([])

        // AFFICHER LES HÔTELS
        if (displayMode === 'hotels') {
          for (const hotel of hotels) {
            try {
              // Obtenir les coordonnées de l'hôtel par géocodage
              const coordinates = await geocodeAddress(hotel.address, hotel.city, hotel.zipCode)

              // Vérifier que les coordonnées sont valides
              if (isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
                console.error(`Coordonnées invalides pour l'hôtel ${hotel.name}:`, coordinates)
                continue
              }

              // Obtenir toutes les chambres pour cet hôtel
              const hotelRooms = hotel.rooms || filteredRooms.filter((room) => room.hotelId === hotel.id)

              // Calculer le prix minimum si des chambres sont disponibles
              const roomsCount = hotelRooms.length
              const minPrice = roomsCount > 0 ? Math.min(...hotelRooms.map((room) => room.price)) : null

              // Créer un marqueur personnalisé avec icône (style checkpoint)
              const isSelected = selectedItem === hotel.id

              // Nouveau style amélioré avec label au-dessus du marker
              const markerHtml = `
                <div style="position: relative; width: 150px; height: 70px; text-align: center;">
                  <div style="
                    position: absolute;
                    bottom: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: #323842;
                    color: white;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                    z-index: 1;
                    ${isSelected ? 'transform: translateX(-50%) scale(1.1);' : ''}
                    transition: transform 0.2s ease;
                  ">
                    <span style="font-size: 14px; font-weight: bold;">${minPrice ? `${minPrice}€` : 'H'}</span>
                  </div>
                  <div style="
                    position: absolute;
                    bottom: 55px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: white;
                    color: #323842;
                    padding: 6px 12px;
                    border-radius: 16px;
                    font-weight: bold;
                    font-size: 13px;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.15);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 140px;
                    z-index: 2;
                  ">
                    ${hotel.name}
                  </div>
                </div>
              `;

              const icon = L.divIcon({
                className: "custom-hotel-marker",
                html: markerHtml,
                iconSize: [150, 70],
                iconAnchor: [75, 10], // Ajusté pour que le checkpoint pointe à la bonne position
              })

              // Ajouter le marqueur à la carte
              const marker = L.marker([coordinates.lat, coordinates.lng], { icon }).addTo(map)
              markersRef.current.push(marker)

              // Créer une popup avec les détails de l'hôtel
              const popupContent = `
                <div style="max-width: 250px;">
                  <h3 style="font-size: 16px; font-weight: 500; margin-bottom: 5px;">${hotel.name}</h3>
                  <p style="font-size: 14px; color: #666; margin-bottom: 10px;">${hotel.address}, ${hotel.city} ${hotel.zipCode}</p>
                  ${roomsCount > 0 ? `<p style="font-size: 14px; font-weight: 700; margin-bottom: 5px;">${roomsCount} chambre${roomsCount > 1 ? 's' : ''} disponible${roomsCount > 1 ? 's' : ''}</p>` : ''}
                  ${minPrice !== null ? `<p style="font-size: 14px;">À partir de <span style="font-weight: bold;">${minPrice}€</span> / nuit</p>` : ''}
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
                setSelectedItem(hotel.id)
              })

              // Étendre les limites pour inclure ce marqueur
              bounds.extend([coordinates.lat, coordinates.lng])
            } catch (error) {
              console.error(`Erreur lors de l'ajout du marqueur pour ${hotel.name}:`, error)
            }
          }
        }

        // AFFICHER LES CHAMBRES INDIVIDUELLES
        if (displayMode === 'rooms') {
          // Créer un Map pour stocker les coordonnées des hôtels déjà géocodés
          const hotelCoordinates = new Map<string, GeoCoordinates>();

          // Map pour regrouper les chambres par hôtel et stocker leurs prix
          const hotelRoomPrices = new Map<string, number[]>();

          // Première passe : regrouper toutes les chambres par hôtel et collecter les prix
          filteredRooms.forEach(room => {
            const hotelId = room.hotelId || room.hotel?.id;
            if (hotelId) {
              if (!hotelRoomPrices.has(hotelId)) {
                hotelRoomPrices.set(hotelId, []);
              }
              hotelRoomPrices.get(hotelId)?.push(room.price);
            }
          });

          // Ensemble pour suivre les hôtels déjà affichés
          const displayedHotels = new Set<string>();

          for (const room of filteredRooms) {
            try {
              // Trouver l'hôtel associé à cette chambre
              const hotel = hotels.find(h => h.id === room.hotelId) || room.hotel;
              const hotelId = hotel?.id;

              if (!hotel || !hotelId) {
                console.warn(`Hôtel introuvable pour la chambre ${room.id}`);
                continue;
              }

              // Si nous avons déjà affiché un marqueur pour cet hôtel, passer à la chambre suivante
              if (displayedHotels.has(hotelId)) {
                continue;
              }

              // Marquer cet hôtel comme affiché
              displayedHotels.add(hotelId);

              // Vérifier si nous avons déjà les coordonnées pour cet hôtel
              let coordinates: GeoCoordinates;

              if (hotelCoordinates.has(hotelId)) {
                coordinates = hotelCoordinates.get(hotelId)!;
              } else {
                // Sinon, géocoder l'adresse
                coordinates = await geocodeAddress(hotel.address, hotel.city, hotel.zipCode);

                // Stocker les coordonnées pour une utilisation ultérieure
                hotelCoordinates.set(hotelId, coordinates);
              }

              // Vérifier que les coordonnées sont valides
              if (isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
                console.error(`Coordonnées invalides pour l'hôtel ${hotel.name}:`, coordinates);
                continue;
              }

              // Obtenir les prix des chambres pour cet hôtel
              const prices = hotelRoomPrices.get(hotelId) || [];
              const minPrice = prices.length > 0 ? Math.min(...prices) : room.price;
              const maxPrice = prices.length > 0 ? Math.max(...prices) : room.price;
              const roomCount = prices.length;

              // Créer un marqueur personnalisé pour la chambre (style checkpoint)
              const isSelected = selectedItem === room.id || selectedItem === hotel.id;

              // Texte du prix selon qu'il y ait une ou plusieurs chambres
              let priceText = `${minPrice}€`;
              if (roomCount > 1 && minPrice !== maxPrice) {
                priceText = `${minPrice}-${maxPrice}€`;
              }

              // Taille de police adaptative selon la longueur du texte
              const fontSize = priceText.length > 6 ? "11px" : "13px";

              // Nouveau style amélioré pour afficher la fourchette de prix au-dessus du marker
              const markerHtml = `
              <div style="position: relative; width: 150px; height: 70px; text-align: center;">
                <div style="
                  position: absolute;
                  bottom: 10px;
                  left: 50%;
                  transform: translateX(-50%);
                  background-color: ${isSelected ? "#FF385C" : "#4F46E5"};
                  color: white;
                  border-radius: 4px;
                  padding: 6px 12px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                  z-index: 1;
                  ${isSelected ? 'transform: translateX(-50%) scale(1.1);' : ''}
                  transition: transform 0.2s ease;
                ">
                  <span style="font-size: ${fontSize}; font-weight: bold;">${priceText}</span>
                </div>
                <div style="
                  position: absolute;
                  bottom: 45px;
                  left: 50%;
                  transform: translateX(-50%);
                  background-color: white;
                  color: #323842;
                  padding: 6px 12px;
                  border-radius: 16px;
                  font-weight: bold;
                  font-size: 13px;
                  box-shadow: 0 3px 10px rgba(0,0,0,0.15);
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  max-width: 140px;
                  z-index: 2;
                ">
                  ${hotel.name}
                  ${roomCount > 1 ? `<span style="font-size: 11px; display: block; opacity: 0.8;">${roomCount} chambres</span>` : ''}
                </div>
              </div>
            `;

              const icon = L.divIcon({
                className: "custom-room-marker",
                html: markerHtml,
                iconSize: [150, 85],
                iconAnchor: [75, 10],
              });

              // Ajouter le marqueur à la carte
              const marker = L.marker([coordinates.lat, coordinates.lng], { icon }).addTo(map);
              markersRef.current.push(marker);

              // Créer une popup avec les détails des chambres
              let roomListHtml = '';

              // Si plusieurs chambres, les lister dans la popup
              if (roomCount > 1) {
                const hotelRooms = filteredRooms.filter(r => r.hotelId === hotelId || (r.hotel && r.hotel.id === hotelId));
                roomListHtml = `
          <div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
            <p style="font-size: 14px; font-weight: 700; margin-bottom: 5px;">${roomCount} chambres disponibles :</p>
            <ul style="margin: 0; padding-left: 15px;">
              ${hotelRooms.map(r => `
                <li style="margin-bottom: 5px;">
                  <div style="font-size: 13px; font-weight: 500;">${r.name}</div>
                  <div style="font-size: 13px;">${r.price}€ / nuit</div>
                </li>
              `).join('')}
            </ul>
          </div>
        `;
              }

              const popupContent = `
        <div style="max-width: 250px;">
          <h3 style="font-size: 16px; font-weight: 500; margin-bottom: 5px;">${hotel.name}</h3>
          <p style="font-size: 14px; color: #666; margin-bottom: 10px;">${hotel.address}, ${hotel.city} ${hotel.zipCode}</p>
          <div style="display: flex; align-items: center; margin-top: 5px;">
            <span style="font-size: 14px; margin-right: 5px;">${hotel.rate}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="#FFD700">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          </div>
          ${roomListHtml}
          <div style="margin-top: 5px; display: flex; flex-wrap: wrap; gap: 4px;">
            ${room.categories.split(',').map(cat =>
                `<span style="background-color: #F3F4F6; color: #4B5563; padding: 2px 6px; border-radius: 9999px; font-size: 11px;">${cat.trim()}</span>`
              ).join('')}
          </div>
        </div>
      `;

              marker.bindPopup(popupContent);

              // Ajouter un événement au clic sur le marqueur
              marker.on("click", () => {
                setSelectedItem(hotel.id);
              });

              // Étendre les limites pour inclure ce marqueur
              bounds.extend([coordinates.lat, coordinates.lng]);
            } catch (error) {
              console.error(`Erreur lors de l'ajout du marqueur pour la chambre ${room.name}:`, error);
            }
          }
        }

        // Ajuster la vue de la carte pour afficher tous les marqueurs
        if (bounds.isValid()) {
          try {
            // Si une seule chambre est affichée, zoomer davantage
            if (displayMode === 'rooms' && filteredRooms.length === 1) {
              const room = filteredRooms[0];
              const hotel = hotels.find(h => h.id === room.hotelId) || room.hotel;

              if (hotel) {
                const coordinates = await geocodeAddress(hotel.address, hotel.city, hotel.zipCode);
                map.setView([coordinates.lat, coordinates.lng], 16);
              } else {
                map.fitBounds(bounds, { padding: [50, 50] });
              }
            } else {
              // Ajuster la vue pour afficher tous les points
              map.fitBounds(bounds, { padding: [50, 50] });

              // Limiter le niveau de zoom maximum pour une vue d'ensemble
              const currentZoom = map.getZoom();
              if (currentZoom > 15) {
                map.setZoom(15);
              } else if (currentZoom < 6 && bounds.isValid() && bounds.getNorth() - bounds.getSouth() < 1) {
                // Si le zoom est trop faible mais que les points sont proches, augmenter le zoom
                map.setZoom(8);
              }
            }
          } catch (error) {
            console.error("Erreur lors de l'ajustement de la vue de la carte:", error)
          }
        }

        console.log("Map updated with markers")
      } catch (error) {
        console.error("Erreur lors de la mise à jour des marqueurs:", error)
      } finally {
        setIsGeocoding(false)
      }
    }

    // Mettre à jour les marqueurs
    updateMarkers()
  }, [filteredRooms, hotels, mapInitialized, L, isGeocoding, selectedItem, displayMode])

  return (
    <>
      <div ref={mapRef} className="h-full w-full" />
      {isGeocoding && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-[1000]">
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-gray-600">Géocodage des adresses en cours...</p>
          </div>
        </div>
      )}
      <style jsx global>{`
        .custom-hotel-marker, .custom-room-marker {
          transition: transform 0.2s ease;
          z-index: 400;
        }
        .custom-hotel-marker:hover, .custom-room-marker:hover {
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