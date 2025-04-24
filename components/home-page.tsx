"use client";

import HotelChatbot from '@/components/chatbot';
import LeafletMap from '@/components/leaflet-map'; // Remplacer GoogleMapComponent par LeafletMap
import RoomList from '@/components/rooms-list';
import { useSearch } from '@/lib/search-context';
import { useCallback, useState } from 'react';

// Type pour les chambres
type Room = {
    id: string;
    name: string;
    price: number;
    rate: number;
    content: string;
    categories: string;
    tags: string;
    hotelId: string;
    createdAt: string;
    updatedAt: string;
};

export default function HomePage() {
    const { searchTerm } = useSearch();
    const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);

    // Fonction pour recevoir les chambres filtrées du composant RoomList
    // Mémorisée avec useCallback pour éviter des rendus inutiles
    const handleFilteredRoomsChange = useCallback((rooms: Room[]) => {
        setFilteredRooms(rooms);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Liste des chambres (2/3 de la largeur sur les grands écrans) */}
                    <div className="lg:col-span-2">
                        <RoomList
                            searchTerm={searchTerm}
                            onFilteredRoomsChange={handleFilteredRoomsChange}
                        />
                    </div>

                    {/* Carte (1/3 de la largeur sur les grands écrans) */}
                    <div className="h-[calc(100vh-200px)] sticky top-24">
                        <h2 className="text-xl font-semibold mb-4">Carte des hôtels</h2>
                        <LeafletMap filteredRooms={filteredRooms} />
                    </div>
                </div>

                <div className="mt-12">
                    <HotelChatbot />
                </div>
            </div>
        </div>
    );
}