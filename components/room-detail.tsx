"use client";

import { ArrowLeft, Calendar, Euro, Heart, Hotel, Star, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

// Types
type RoomType = {
    id: string;
    name: string;
};

type Hotel = {
    id: string;
    name: string;
    address: string;
    city: string;
    zipCode: string;
    phone: string;
    rate: number;
};

type RoomWithRelations = {
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
    hotel: Hotel;
    types: {
        type: RoomType;
    }[];
};

type RoomParams = {
    id: string;
};

export default function RoomDetail({ params }: { params: RoomParams }) {
    // Déballer les paramètres avec use() et le bon typage
    const unwrappedParams = use(params as unknown as Promise<RoomParams>);
    const roomId = unwrappedParams.id;

    const [room, setRoom] = useState<RoomWithRelations | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        async function fetchRoomData() {
            if (!roomId) {
                if (isMounted) {
                    setIsLoading(false);
                }
                return;
            }

            try {
                setIsLoading(true);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const res = await fetch(`/api/rooms/${roomId}`, {
                    signal: controller.signal,
                    cache: 'no-store',
                });

                clearTimeout(timeoutId);

                const data = await res.json();

                if (isMounted) {
                    setRoom(data);
                    setIsLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : "Une erreur s'est produite");
                    setIsLoading(false);
                }
            }
        }

        fetchRoomData();

        return () => {
            isMounted = false;
        };
    }, [roomId]);

    const toggleFavorite = () => {
        setIsFavorite((prev) => !prev);
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % 5);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + 5) % 5);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-lg text-gray-600">Chargement des informations...</p>
                    <p className="mt-2 text-sm text-gray-500">ID: {roomId}</p>
                </div>
            </div>
        );
    }

    if (error || !room) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-lg px-4">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
                    <p className="text-gray-700 mb-6">{error || "Impossible de charger les informations de la chambre"}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour à l'accueil
                    </button>
                </div>
            </div>
        );
    }

    const roomTags = room.tags.split(",").map((tag) => tag.trim());
    const roomCategories = room.categories.split(",").map((category) => category.trim());

    return (
        <div className="container mx-auto px-4 py-8">
            {/* En-tête avec bouton retour */}
            <div className="mb-6">
                <Link
                    href="/"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour aux chambres
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Galerie d'images - Côté gauche sur grands écrans */}
                <div className="lg:col-span-2">
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-gray-100">
                        <img
                            src="/hotel.jpg"
                            alt={room.name}
                            className="w-full h-full object-cover"
                        />

                        {/* Navigation entre images */}
                        <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md opacity-80 hover:opacity-100 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>

                        <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md opacity-80 hover:opacity-100 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>

                        {/* Points de pagination des images */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                            {[...Array(5)].map((_, i) => (
                                <span
                                    key={i}
                                    className={`block h-2 w-2 rounded-full ${currentImageIndex === i ? "bg-white" : "bg-white/50"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Galerie de miniatures */}
                    <div className="grid grid-cols-5 gap-2 mt-2">
                        {[...Array(5)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentImageIndex(i)}
                                className={`relative rounded-lg overflow-hidden aspect-square ${currentImageIndex === i
                                    ? "ring-2 ring-blue-500"
                                    : "opacity-70 hover:opacity-100"
                                    }`}
                            >
                                <img
                                    src="/hotel.jpg"
                                    alt={`Miniature ${i + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>

                    {/* Description de la chambre */}
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold mb-4">Description</h2>
                        <p className="text-gray-700 leading-relaxed">{room.content}</p>

                        {/* Tags et Catégories */}
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-2">Caractéristiques</h3>
                            <div className="flex flex-wrap gap-2">
                                {roomTags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                                    >
                                        <Tag className="h-3 w-3 mr-1" />
                                        {tag}
                                    </span>
                                ))}
                                {roomCategories.map((category, index) => (
                                    <span
                                        key={`cat-${index}`}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                                    >
                                        {category}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Informations sur la chambre et panneau de réservation - Côté droit sur grands écrans */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
                        {/* En-tête de la chambre */}
                        <div className="flex justify-between items-start">
                            <h1 className="text-2xl font-bold">{room.name}</h1>
                            <button
                                onClick={toggleFavorite}
                                className="p-2 rounded-full hover:bg-gray-100"
                            >
                                <Heart
                                    className={`h-6 w-6 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Note */}
                        <div className="flex items-center mt-2">
                            <div className="flex items-center text-amber-500">
                                <Star className="h-5 w-5 fill-current" />
                                <span className="ml-1 font-medium">{room.rate}</span>
                            </div>
                            {room.rate >= 4.8 && (
                                <span className="ml-2 text-sm bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full">
                                    Coup de cœur voyageurs
                                </span>
                            )}
                        </div>

                        {/* Informations sur l'hôtel */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-start">
                                <Hotel className="h-5 w-5 text-gray-500 mt-0.5 mr-2" />
                                <div>
                                    <h3 className="font-medium">{room.hotel.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {room.hotel.address}, {room.hotel.zipCode} {room.hotel.city}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Tél: {room.hotel.phone}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section prix et réservation */}
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-baseline">
                                    <span className="text-2xl font-bold">{room.price} €</span>
                                    <span className="text-gray-600 ml-1">/ nuit</span>
                                </div>
                            </div>

                            {/* Formulaire de réservation - simplifié pour la démo */}
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="check-in" className="block text-sm font-medium text-gray-700 mb-1">
                                        Date d'arrivée
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="date"
                                            id="check-in"
                                            className="pl-10 w-full rounded-md border border-gray-300 py-2"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="check-out" className="block text-sm font-medium text-gray-700 mb-1">
                                        Date de départ
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="date"
                                            id="check-out"
                                            className="pl-10 w-full rounded-md border border-gray-300 py-2"
                                        />
                                    </div>
                                </div>

                                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition">
                                    Réserver
                                </button>

                                {/* Option de négociation */}
                                <button className="w-full bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 py-3 px-4 rounded-xl font-medium transition flex items-center justify-center">
                                    <Euro className="h-5 w-5 mr-2" />
                                    Proposer un prix
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}