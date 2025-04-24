"use client";

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';

// Types pour les chambres et hôtels
type Hotel = {
    id: string;
    name: string;
    rate: number;
    address: string;
    city: string;
    zipCode: string;
    phone: string;
    rooms?: Room[];
};

type Room = {
    id: string;
    name: string;
    price: number;
    rate: number;
    content: string;
    categories: string;
    tags: string;
    hotelId: string;
};

interface MapClientComponentProps {
    filteredRooms: Room[];
    hotels: Hotel[];
}

export default function MapClientComponent({ filteredRooms, hotels }: MapClientComponentProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

    // Effet d'initialisation de la carte - exécuté une seule fois
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Import dynamique de Leaflet
        const L = require('leaflet');

        // Fix pour les icônes de Leaflet
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        });

        console.log("Initializing Leaflet map...");

        // Créer l'instance de carte
        const map = L.map(mapRef.current).setView([48.8566, 2.3522], 12); // Paris comme centre par défaut

        // Ajouter la couche OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);

        // Stocker l'instance de map dans la référence
        mapInstanceRef.current = map;

        // Pas besoin de nettoyer les marqueurs ici car aucun n'est encore créé

        // Nettoyage à la destruction du composant
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []); // Dépendances vides - s'exécute seulement au montage

    // Effet de mise à jour des marqueurs - exécuté quand filteredRooms ou hotels change
    useEffect(() => {
        if (!mapInstanceRef.current || hotels.length === 0) return;

        const L = require('leaflet');
        const map = mapInstanceRef.current;

        // Fonction pour mettre à jour les marqueurs
        function updateMarkers() {
            // Supprimer les marqueurs existants
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];

            // Obtenir les hôtels pertinents
            const filteredHotelIds = new Set(filteredRooms.map(room => room.hotelId));
            const relevantHotels = hotels.filter(hotel => filteredHotelIds.has(hotel.id));
            console.log(`Found ${relevantHotels.length} relevant hotels`);

            // Si nous avons des hôtels pertinents, ajuster la vue de la carte
            if (relevantHotels.length > 0) {
                const bounds = L.latLngBounds([]);

                relevantHotels.forEach((hotel, index) => {
                    // Obtenir toutes les chambres pour cet hôtel qui sont dans la liste filtrée
                    const hotelRooms = filteredRooms.filter(room => room.hotelId === hotel.id);

                    // Obtenir la chambre avec le prix le plus bas pour cet hôtel
                    const minPrice = Math.min(...hotelRooms.map(room => room.price));

                    // Créer des positions pseudo-aléatoires basées sur Paris
                    const lat = 48.8566 + (index * 0.005) * (Math.random() > 0.5 ? 1 : -1);
                    const lng = 2.3522 + (index * 0.005) * (Math.random() > 0.5 ? 1 : -1);

                    // Créer un marqueur personnalisé avec icône de prix
                    const priceIcon = L.divIcon({
                        className: 'custom-price-marker',
                        html: `<div style="background-color:#4f46e5; color:white; padding:6px 12px; border-radius:9999px; font-weight:bold; font-size:14px; min-width:60px; text-align:center; box-shadow:0 2px 4px rgba(0,0,0,0.2);">${minPrice}€</div>`,
                        iconSize: [80, 40],
                        iconAnchor: [40, 20]
                    });

                    // Ajouter le marqueur à la carte
                    const marker = L.marker([lat, lng], { icon: priceIcon }).addTo(map);
                    markersRef.current.push(marker);

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
                    `;

                    marker.bindPopup(popupContent);

                    // Étendre les limites pour inclure ce marqueur
                    bounds.extend([lat, lng]);
                });

                // Ajuster la vue de la carte pour afficher tous les marqueurs
                if (bounds.isValid()) {
                    map.fitBounds(bounds, {
                        padding: [50, 50]
                    });

                    // Limiter le niveau de zoom maximum
                    if (map.getZoom() > 15) {
                        map.setZoom(15);
                    }
                }

                console.log("Map updated with markers");
            }
        }

        // Mettre à jour les marqueurs
        updateMarkers();

    }, [filteredRooms, hotels]); // Dépendances: filteredRooms et hotels

    return (
        <>
            <div ref={mapRef} className="h-full w-full" />
            <style jsx global>{`
                .custom-price-marker {
                    transition: transform 0.2s ease;
                }
                .custom-price-marker:hover {
                    transform: scale(1.1);
                    z-index: 1000 !important;
                }
                .leaflet-popup-content-wrapper {
                    border-radius: 8px;
                    padding: 5px;
                }
            `}</style>
        </>
    );
}