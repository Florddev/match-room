"use client";
import { Heart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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

interface RoomListProps {
    searchTerm: string;
    onFilteredRoomsChange?: (rooms: Room[]) => void;
}

export default function RoomList({ searchTerm, onFilteredRoomsChange }: RoomListProps) {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [currentImageIndexes, setCurrentImageIndexes] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Mémorise la fonction de callback pour éviter les rendus infinis
    const updateParentWithFilteredRooms = useCallback((roomsToUpdate: Room[]) => {
        if (onFilteredRoomsChange) {
            onFilteredRoomsChange(roomsToUpdate);
        }
    }, [onFilteredRoomsChange]);

    // Fetch rooms data only once
    useEffect(() => {
        let isMounted = true;

        async function fetchRooms() {
            try {
                console.log("Fetching rooms data...");
                const res = await fetch("/api/rooms", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!res.ok) throw new Error("Erreur lors du chargement des chambres");

                const data: Room[] = await res.json();

                if (!isMounted) return;

                // Initialize image indexes
                const initialIndexes: Record<string, number> = {};
                data.forEach(room => {
                    initialIndexes[room.id] = 0;
                });

                setCurrentImageIndexes(initialIndexes);
                setRooms(data);
                setFilteredRooms(data);
                updateParentWithFilteredRooms(data);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching rooms:", error);
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchRooms();

        // Clean up function
        return () => {
            isMounted = false;
        };
    }, []); // Dépendances vides - s'exécute seulement au montage

    // Filtrer les chambres lorsque le terme de recherche change
    useEffect(() => {
        if (rooms.length === 0) return;

        const similarityThreshold = 0.5;
        const term = searchTerm.trim();

        if (term === "") {
            setFilteredRooms(rooms);
            updateParentWithFilteredRooms(rooms);
            return;
        }

        const searchWords = term.toLowerCase().split(/\s+/);

        const results = rooms.filter((room) => {
            return searchWords.some((word) => {
                const nameSimilarity = Math.max(
                    ...room.name
                        .toLowerCase()
                        .split(/\s+/)
                        .map((nameWord) => calculateSimilarity(word, nameWord)),
                    0
                );

                const contentSimilarity = Math.max(
                    ...room.content
                        .toLowerCase()
                        .split(/\s+/)
                        .map((contentWord) => calculateSimilarity(word, contentWord)),
                    0
                );

                const categoriesSimilarity = Math.max(
                    ...room.categories
                        .toLowerCase()
                        .split(/\s+/)
                        .map((catWord) => calculateSimilarity(word, catWord)),
                    0
                );

                const tagsSimilarity = Math.max(
                    ...room.tags
                        .toLowerCase()
                        .split(/\s+/)
                        .map((tagWord) => calculateSimilarity(word, tagWord)),
                    0
                );

                const priceStr = room.price.toString();
                const priceSimilarity = calculateSimilarity(word, priceStr);

                const rateStr = room.rate.toString();
                const rateSimilarity = calculateSimilarity(word, rateStr);

                return (
                    nameSimilarity >= similarityThreshold ||
                    contentSimilarity >= similarityThreshold ||
                    categoriesSimilarity >= similarityThreshold ||
                    tagsSimilarity >= similarityThreshold ||
                    priceSimilarity >= similarityThreshold ||
                    rateSimilarity >= similarityThreshold
                );
            });
        });

        const sortedResults = results.sort((a, b) => {
            const aRelevance = calculateOverallRelevance(a, searchWords);
            const bRelevance = calculateOverallRelevance(b, searchWords);
            return bRelevance - aRelevance;
        });

        setFilteredRooms(sortedResults);
        updateParentWithFilteredRooms(sortedResults);
    }, [searchTerm, rooms, updateParentWithFilteredRooms]);

    // Reusing your existing search logic with Levenshtein distance
    function levenshteinDistance(a: string, b: string): number {
        const matrix: number[][] = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                const cost = a[j - 1] === b[i - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        return matrix[b.length][a.length];
    }

    function calculateSimilarity(term: string, text: string): number {
        if (!term || !text) return 0;
        const distance = levenshteinDistance(term.toLowerCase(), text.toLowerCase());
        const maxLength = Math.max(term.length, text.length);
        return 1 - distance / maxLength;
    }

    function calculateOverallRelevance(room: Room, searchWords: string[]): number {
        let totalRelevance = 0;

        searchWords.forEach((word) => {
            const nameSimilarities = room.name
                .toLowerCase()
                .split(/\s+/)
                .map((nameWord) => calculateSimilarity(word, nameWord));

            const contentSimilarities = room.content
                .toLowerCase()
                .split(/\s+/)
                .map((contentWord) => calculateSimilarity(word, contentWord));

            const categoriesSimilarities = room.categories
                .toLowerCase()
                .split(/\s+/)
                .map((catWord) => calculateSimilarity(word, catWord));

            const tagsSimilarities = room.tags
                .toLowerCase()
                .split(/\s+/)
                .map((tagWord) => calculateSimilarity(word, tagWord));

            const priceStr = room.price.toString();
            const priceSimilarity = calculateSimilarity(word, priceStr);

            const rateStr = room.rate.toString();
            const rateSimilarity = calculateSimilarity(word, rateStr);

            totalRelevance += Math.max(...nameSimilarities, 0) * 3;
            totalRelevance += Math.max(...contentSimilarities, 0) * 2;
            totalRelevance += Math.max(...categoriesSimilarities, 0) * 2.5;
            totalRelevance += Math.max(...tagsSimilarities, 0) * 2;
            totalRelevance += priceSimilarity * 1.5;
            totalRelevance += rateSimilarity * 1;
        });

        return totalRelevance;
    }

    const toggleFavorite = (roomId: string) => {
        setFavorites(prev => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(roomId)) {
                newFavorites.delete(roomId);
            } else {
                newFavorites.add(roomId);
            }
            return newFavorites;
        });
    };

    const nextImage = (roomId: string) => {
        setCurrentImageIndexes(prev => ({
            ...prev,
            [roomId]: (prev[roomId] + 1) % 5 // Assuming 5 images per room
        }));
    };

    const prevImage = (roomId: string) => {
        setCurrentImageIndexes(prev => ({
            ...prev,
            [roomId]: (prev[roomId] - 1 + 5) % 5 // Assuming 5 images per room
        }));
    };

    return (
        <div className="max-w-full mx-auto">
            <h2 className="text-xl font-semibold mb-4">Chambres disponibles</h2>

            {isLoading ? (
                <div className="text-center py-10">
                    <p className="text-xl text-gray-600">Chargement des chambres...</p>
                </div>
            ) : filteredRooms.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-xl text-gray-600">Aucune chambre trouvée.</p>
                    <p className="mt-2 text-gray-500">Essayez de modifier vos critères de recherche.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredRooms.map((room) => (
                        <div key={room.id} className="flex flex-col h-full">
                            {/* Image carousel */}
                            <div className="relative rounded-2xl overflow-hidden aspect-square mb-3">
                                <img
                                    src="/hotel.jpg"
                                    alt={room.name}
                                    className="object-cover w-full h-full transition-opacity"
                                />

                                {/* Image navigation buttons */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        prevImage(room.id);
                                    }}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md opacity-80 hover:opacity-100 transition"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        nextImage(room.id);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md opacity-80 hover:opacity-100 transition"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>

                                {/* Image pagination dots */}
                                <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-1">
                                    {[...Array(5)].map((_, i) => (
                                        <span
                                            key={i}
                                            className={`block h-1.5 w-1.5 rounded-full ${currentImageIndexes[room.id] === i ? 'bg-white' : 'bg-white/50'}`}
                                        />
                                    ))}
                                </div>

                                {/* Favorite button */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleFavorite(room.id);
                                    }}
                                    className="absolute top-3 right-3 z-10"
                                >
                                    <Heart
                                        className={`h-6 w-6 ${favorites.has(room.id) ? 'fill-red-500 text-red-500' : 'text-white stroke-2'}`}
                                    />
                                </button>

                                {/* Coup de coeur badge */}
                                {room.rate >= 4.8 && (
                                    <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded-full text-xs font-medium flex items-center shadow-sm">
                                        <span className="mr-1">🏆</span>
                                        <span>Coup de cœur voyageurs</span>
                                    </div>
                                )}
                            </div>

                            {/* Room details */}
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium text-gray-900">{room.name}</h3>
                                        <p className="text-gray-500 text-sm mt-1">{room.content}</p>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1">
                                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                        </svg>
                                        <span>{room.rate}</span>
                                    </div>
                                </div>
                                <p className="mt-3 font-medium">{room.price} € par nuit</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}