"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

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

interface LeafletMapProps {
    filteredRooms: Room[];
}

// Composant qui sera chargé seulement côté client
const MapComponent = dynamic(
    () => import('./map-client'),
    {
        ssr: false, // Important : désactive le rendu côté serveur
        loading: () => (
            <div className="flex h-full items-center justify-center bg-gray-100">
                <p>Chargement de la carte...</p>
            </div>
        )
    }
);

export default function LeafletMap({ filteredRooms }: LeafletMapProps) {
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch hotels data
    useEffect(() => {
        let isMounted = true;

        async function fetchHotels() {
            try {
                console.log("Fetching hotels data...");
                const res = await fetch("/api/hotels", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!res.ok) throw new Error("Erreur lors du chargement des hôtels");

                const data: Hotel[] = await res.json();
                console.log(`Loaded ${data.length} hotels`);

                if (!isMounted) return;

                setHotels(data);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching hotels:", error);
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchHotels();

        // Clean up function
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="h-full w-full rounded-lg overflow-hidden border border-gray-200 shadow-md">
            {isLoading ? (
                <div className="flex h-full items-center justify-center bg-gray-100">
                    <p>Chargement de la carte...</p>
                </div>
            ) : (
                <MapComponent
                    filteredRooms={filteredRooms}
                    hotels={hotels}
                />
            )}
        </div>
    );
}