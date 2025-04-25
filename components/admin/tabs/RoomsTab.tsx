"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
    Form, FormControl, FormDescription, FormField,
    FormItem, FormLabel, FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building, Check, Filter, Hotel, Loader2, Pencil, Plus, Search, Star, Tag, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

// Types pour les chambres et relations
type RoomType = {
    id: string
    name: string
}

type TypeRelation = {
    id: string
    roomId: string
    typeId: string
    type: RoomType
}

type Hotel = {
    id: string
    name: string
    city: string
}

type Room = {
    id: string
    name: string
    price: number
    rate: number
    content: string
    categories: string
    tags?: string
    hotelId: string
    createdAt: string
    updatedAt: string
    types: TypeRelation[]
    hotel: Hotel
}

// Schéma de validation pour le formulaire de création/modification de chambre
const roomFormSchema = z.object({
    name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
    price: z.coerce.number().min(0, { message: "Le prix doit être positif" }),
    rate: z.coerce.number().min(0).max(5, { message: "La note doit être comprise entre 0 et 5" }),
    content: z.string().min(10, { message: "La description doit contenir au moins 10 caractères" }),
    categories: z.string().min(2, { message: "Ajoutez au moins une catégorie" }),
    tags: z.string().optional(),
    hotelId: z.string().min(1, { message: "L'hôtel est requis" }),
    typeIds: z.array(z.string()).min(1, { message: "Sélectionnez au moins un type de chambre" }),
});

export function RoomsTab() {
    const [rooms, setRooms] = useState<Room[]>([])
    const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
    const [hotels, setHotels] = useState<Hotel[]>([])
    const [types, setTypes] = useState<RoomType[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [editingRoom, setEditingRoom] = useState<Room | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const [selectedHotelFilter, setSelectedHotelFilter] = useState<string>("all")
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all")
    const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(false)
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
    const [maxPrice, setMaxPrice] = useState(1000)

    const form = useForm<z.infer<typeof roomFormSchema>>({
        resolver: zodResolver(roomFormSchema),
        defaultValues: {
            name: "",
            price: 0,
            rate: 0,
            content: "",
            categories: "",
            tags: "",
            hotelId: "",
            typeIds: [],
        },
    });

    // Charger les données
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)

                // Simuler le chargement depuis l'API

                // Simulation des types de chambres
                const mockTypes: RoomType[] = [
                    { id: "1", name: "Suite" },
                    { id: "2", name: "Simple" },
                    { id: "3", name: "Double" },
                    { id: "4", name: "Familiale" },
                    { id: "5", name: "Prestige" }
                ];

                // Simulation des hôtels
                const mockHotels: Hotel[] = [
                    { id: "1", name: "Hôtel Luxor Palace", city: "Paris" },
                    { id: "2", name: "Le Méridien Nice", city: "Nice" },
                    { id: "3", name: "Château Bordeaux", city: "Bordeaux" },
                    { id: "4", name: "Les Suites de Marseille", city: "Marseille" },
                    { id: "5", name: "Le Grand Lyon", city: "Lyon" },
                ];

                // Simulation des chambres
                const mockRooms: Room[] = [
                    {
                        id: "1",
                        name: "Suite Royale",
                        price: 450,
                        rate: 4.9,
                        content: "Suite luxueuse avec vue panoramique, jacuzzi privatif et service de majordome inclus.",
                        categories: "Luxe,Vue,Service Premium",
                        tags: "jacuzzi,king size,vue panoramique,majordome",
                        hotelId: "1",
                        hotel: mockHotels[0],
                        types: [
                            { id: "rel1", roomId: "1", typeId: "1", type: mockTypes[0] },
                            { id: "rel2", roomId: "1", typeId: "4", type: mockTypes[4] }
                        ],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        id: "2",
                        name: "Chambre Double Supérieure",
                        price: 180,
                        rate: 4.5,
                        content: "Chambre spacieuse avec lit double, vue sur le jardin et petit-déjeuner inclus.",
                        categories: "Confort,Vue Jardin",
                        tags: "lit double,petit-déjeuner,vue jardin",
                        hotelId: "1",
                        hotel: mockHotels[0],
                        types: [
                            { id: "rel3", roomId: "2", typeId: "2", type: mockTypes[2] }
                        ],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        id: "3",
                        name: "Suite Vue Mer",
                        price: 320,
                        rate: 4.7,
                        content: "Suite élégante avec vue imprenable sur la Méditerranée, terrasse privée et équipements premium.",
                        categories: "Vue Mer,Terrasse,Premium",
                        tags: "vue mer,terrasse,king size,douche italienne",
                        hotelId: "2",
                        hotel: mockHotels[1],
                        types: [
                            { id: "rel4", roomId: "3", typeId: "1", type: mockTypes[0] }
                        ],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        id: "4",
                        name: "Chambre Familiale",
                        price: 250,
                        rate: 4.6,
                        content: "Chambre spacieuse avec un lit double et deux lits simples, parfaite pour les familles.",
                        categories: "Famille,Spacieux",
                        tags: "famille,spacieux,multiple lits",
                        hotelId: "3",
                        hotel: mockHotels[2],
                        types: [
                            { id: "rel5", roomId: "4", typeId: "3", type: mockTypes[3] }
                        ],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        id: "5",
                        name: "Chambre Vue Port",
                        price: 210,
                        rate: 4.3,
                        content: "Chambre confortable avec vue sur le vieux port et balcon privatif.",
                        categories: "Vue Port,Balcon",
                        tags: "vue port,balcon,douche",
                        hotelId: "4",
                        hotel: mockHotels[3],
                        types: [
                            { id: "rel6", roomId: "5", typeId: "2", type: mockTypes[2] }
                        ],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                ];

                // Définir le prix maximum pour le filtre
                const highestPrice = Math.max(...mockRooms.map(room => room.price));
                setMaxPrice(Math.ceil(highestPrice / 100) * 100);
                setPriceRange([0, Math.ceil(highestPrice / 100) * 100]);

                setRooms(mockRooms);
                setFilteredRooms(mockRooms);
                setHotels(mockHotels);
                setTypes(mockTypes);
            } catch (error) {
                console.error("Erreur lors du chargement des données:", error);
                alert("Impossible de charger les données");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filtrer les chambres
    useEffect(() => {
        let filtered = [...rooms];

        // Filtre par hôtel
        if (selectedHotelFilter !== "all") {
            filtered = filtered.filter(room => room.hotelId === selectedHotelFilter);
        }

        // Filtre par type
        if (selectedTypeFilter !== "all") {
            filtered = filtered.filter(room =>
                room.types.some(typeRel => typeRel.typeId === selectedTypeFilter)
            );
        }

        // Filtre par prix
        filtered = filtered.filter(room =>
            room.price >= priceRange[0] && room.price <= priceRange[1]
        );

        // Filtre par terme de recherche
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (room) =>
                    room.name.toLowerCase().includes(term) ||
                    room.content.toLowerCase().includes(term) ||
                    room.categories.toLowerCase().includes(term) ||
                    (room.tags && room.tags.toLowerCase().includes(term)) ||
                    room.hotel.name.toLowerCase().includes(term)
            );
        }

        setFilteredRooms(filtered);
    }, [searchTerm, selectedHotelFilter, selectedTypeFilter, priceRange, rooms]);

    // Gérer la création ou la mise à jour d'une chambre
    const handleSubmit = async (values: z.infer<typeof roomFormSchema>) => {
        try {
            setIsSubmitting(true);

            // Si on modifie une chambre existante
            if (editingRoom) {
                // Simulation de mise à jour (à remplacer par l'appel API)

                // Mise à jour locale
                const updatedRooms = rooms.map(room => {
                    if (room.id === editingRoom.id) {
                        const hotel = hotels.find(h => h.id === values.hotelId)!;
                        const roomTypes = values.typeIds.map(typeId => {
                            const type = types.find(t => t.id === typeId)!;
                            return {
                                id: `rel-${room.id}-${typeId}`,
                                roomId: room.id,
                                typeId: typeId,
                                type: type
                            };
                        });

                        return {
                            ...room,
                            ...values,
                            hotel,
                            types: roomTypes
                        };
                    }
                    return room;
                });

                setRooms(updatedRooms);
                alert(`Les informations de la chambre ${values.name} ont été mises à jour.`);
            } else {
                // Simulation de création (à remplacer par l'appel API)

                // Création locale avec ID fictif
                const newId = `new-${Date.now()}`;
                const hotel = hotels.find(h => h.id === values.hotelId)!;
                const roomTypes = values.typeIds.map(typeId => {
                    const type = types.find(t => t.id === typeId)!;
                    return {
                        id: `rel-${newId}-${typeId}`,
                        roomId: newId,
                        typeId: typeId,
                        type: type
                    };
                });

                const newRoom: Room = {
                    id: newId,
                    ...values,
                    hotel,
                    types: roomTypes,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                setRooms([...rooms, newRoom]);
                alert(`La chambre ${values.name} a été créée avec succès.`);
            }

            // Réinitialiser le formulaire et fermer le dialogue
            form.reset();
            setIsDialogOpen(false);
            setEditingRoom(null);
            setIsCreating(false);
        } catch (error) {
            console.error("Erreur lors de l'enregistrement de la chambre:", error);
            alert("Une erreur est survenue lors de l'enregistrement des données.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Gérer la suppression d'une chambre
    const handleDelete = async (id: string) => {
        try {
            // Simulation de suppression (à remplacer par l'appel API)

            // Suppression locale
            setRooms(rooms.filter(room => room.id !== id));
            setDeleteConfirmId(null);

            alert("La chambre a été supprimée avec succès.");
        } catch (error) {
            console.error("Erreur lors de la suppression de la chambre:", error);
            alert("Impossible de supprimer la chambre.");
        }
    };

    // Ouvrir le formulaire pour édition
    const openEditForm = (room: Room) => {
        setEditingRoom(room);
        form.reset({
            name: room.name,
            price: room.price,
            rate: room.rate,
            content: room.content,
            categories: room.categories,
            tags: room.tags,
            hotelId: room.hotelId,
            typeIds: room.types.map(typeRel => typeRel.typeId),
        });
        setIsDialogOpen(true);
    };

    // Ouvrir le formulaire pour création
    const openCreateForm = () => {
        setEditingRoom(null);
        form.reset({
            name: "",
            price: 0,
            rate: 0,
            content: "",
            categories: "",
            tags: "",
            hotelId: "",
            typeIds: [],
        });
        setIsCreating(true);
        setIsDialogOpen(true);
    };

    // Afficher les étoiles pour la note
    const renderStars = (rate: number) => {
        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(rate) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
                <span className="ml-1 text-sm">{rate.toFixed(1)}</span>
            </div>
        );
    };

    // Rendu des chambres en mode liste
    const renderRoomTable = () => {
        return (
            <div className="border rounded-md overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Hôtel</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Prix</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Note</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRooms.map((room) => (
                            <tr key={room.id} className="border-t">
                                <td className="px-4 py-3 font-medium">{room.name}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center">
                                        <Hotel className="h-4 w-4 mr-1 text-gray-500" />
                                        {room.hotel.name}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {room.types.map((typeRel) => (
                                            <Badge key={typeRel.id} variant="outline">
                                                {typeRel.type.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3 font-medium">{room.price} €</td>
                                <td className="px-4 py-3">{renderStars(room.rate)}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end items-center space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditForm(room)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => setDeleteConfirmId(room.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>

                                        {/* Confirmation de suppression */}
                                        {deleteConfirmId === room.id && (
                                            <div className="absolute bg-background border rounded-md p-2 shadow-md flex items-center gap-2">
                                                <span className="text-sm">Confirmer ?</span>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => handleDelete(room.id)}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => setDeleteConfirmId(null)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Rendu des chambres en mode grille
    const renderRoomGrid = () => {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => (
                    <Card key={room.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{room.name}</CardTitle>
                                <div className="flex">
                                    {renderStars(room.rate)}
                                </div>
                            </div>
                            <CardDescription className="flex items-center">
                                <Hotel className="h-3.5 w-3.5 mr-1" />
                                {room.hotel.name}, {room.hotel.city}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{room.content}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                                {room.types.map((typeRel) => (
                                    <Badge key={typeRel.id} variant="secondary">
                                        {typeRel.type.name}
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {room.categories.split(',').map((category, index) => (
                                    <Badge key={`cat-${index}`} variant="outline" className="bg-blue-50">
                                        {category.trim()}
                                    </Badge>
                                ))}
                            </div>
                            {room.tags && (
                                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {room.tags}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-3">
                            <div className="font-bold text-lg">{room.price} €</div>
                            <div className="space-x-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="hover:bg-background"
                                    onClick={() => openEditForm(room)}
                                >
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Modifier
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:bg-background"
                                    onClick={() => setDeleteConfirmId(room.id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Supprimer
                                </Button>
                            </div>

                            {/* Confirmation de suppression */}
                            {deleteConfirmId === room.id && (
                                <div className="absolute bottom-20 right-4 bg-background border rounded-md p-2 shadow-md flex items-center gap-2">
                                    <span className="text-sm">Confirmer ?</span>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleDelete(room.id)}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setDeleteConfirmId(null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Barre d'outils et recherche */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Rechercher une chambre..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center border rounded-md overflow-hidden">
                        <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            className="rounded-none px-3 h-9"
                            onClick={() => setViewMode("grid")}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "default" : "ghost"}
                            className="rounded-none px-3 h-9"
                            onClick={() => setViewMode("list")}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                <line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                        </Button>
                    </div>
                    <Button onClick={openCreateForm}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouvelle chambre
                    </Button>
                </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-2 items-center">
                <div className="text-sm font-medium">Filtres:</div>

                {/* Filtre par hôtel */}
                <Select value={selectedHotelFilter} onValueChange={setSelectedHotelFilter}>
                    <SelectTrigger className="h-8 w-[180px]">
                        <Building className="h-3.5 w-3.5 mr-1" />
                        <SelectValue placeholder="Filtre par hôtel" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les hôtels</SelectItem>
                        {hotels.map((hotel) => (
                            <SelectItem key={hotel.id} value={hotel.id}>
                                {hotel.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Filtre par type */}
                <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
                    <SelectTrigger className="h-8 w-[180px]">
                        <Tag className="h-3.5 w-3.5 mr-1" />
                        <SelectValue placeholder="Filtre par type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        {types.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                                {type.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Filtre par prix */}
                <div className="relative">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => setIsPriceFilterOpen(!isPriceFilterOpen)}
                    >
                        <Filter className="h-3.5 w-3.5 mr-1" />
                        Prix: {priceRange[0]}€ - {priceRange[1]}€
                    </Button>

                    {isPriceFilterOpen && (
                        <Card className="absolute z-10 mt-1 p-4 min-w-[300px]">
                            <CardContent className="p-0">
                                <div className="text-sm mb-2">Fourchette de prix: {priceRange[0]}€ - {priceRange[1]}€</div>
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={priceRange[1]}
                                        value={priceRange[0]}
                                        onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                                        className="w-24 h-8"
                                    />
                                    <div className="flex-grow">
                                        <div className="flex items-center space-x-2">
                                            <Input
                                                type="range"
                                                min={0}
                                                max={maxPrice}
                                                value={priceRange[0]}
                                                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                                            />
                                            <Input
                                                type="range"
                                                min={priceRange[0]}
                                                max={maxPrice}
                                                value={priceRange[1]}
                                                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                            />
                                        </div>
                                    </div>
                                    <Input
                                        type="number"
                                        min={priceRange[0]}
                                        max={maxPrice}
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                        className="w-24 h-8"
                                    />
                                </div>
                                <div className="flex justify-end mt-4">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setPriceRange([0, maxPrice]);
                                            setIsPriceFilterOpen(false);
                                        }}
                                        className="mr-2"
                                    >
                                        Réinitialiser
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setIsPriceFilterOpen(false)}
                                    >
                                        Appliquer
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Indication du nombre de résultats */}
                <div className="ml-auto text-sm text-muted-foreground">
                    {filteredRooms.length} chambre{filteredRooms.length !== 1 ? "s" : ""}
                </div>
            </div>

            {/* Liste des chambres */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <p className="text-muted-foreground mb-2">Aucune chambre trouvée</p>
                    <Button variant="outline" onClick={openCreateForm}>
                        <Plus className="mr-2 h-4 w-4" />
                        Créer une chambre
                    </Button>
                </div>
            ) : (
                viewMode === "grid" ? renderRoomGrid() : renderRoomTable()
            )}

            {/* Modal de création/édition */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingRoom ? "Modifier une chambre" : "Créer une chambre"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingRoom
                                ? "Modifiez les informations de la chambre ci-dessous."
                                : "Remplissez les informations pour créer une nouvelle chambre."}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom de la chambre</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Suite Royale" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Prix par nuit (€)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="rate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Note (0-5)</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="5"
                                                        step="0.1"
                                                        {...field}
                                                    />
                                                    <div className="flex">{renderStars(field.value)}</div>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="hotelId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hôtel</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner un hôtel" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {hotels.map((hotel) => (
                                                    <SelectItem key={hotel.id} value={hotel.id}>
                                                        {hotel.name} - {hotel.city}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="typeIds"
                                render={() => (
                                    <FormItem>
                                        <div className="mb-2">
                                            <FormLabel>Types de chambre</FormLabel>
                                            <FormDescription>
                                                Sélectionnez un ou plusieurs types pour cette chambre
                                            </FormDescription>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {types.map((type) => (
                                                <FormField
                                                    key={type.id}
                                                    control={form.control}
                                                    name="typeIds"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem
                                                                key={type.id}
                                                                className="flex flex-row items-center space-x-2 space-y-0"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(type.id)}
                                                                        onCheckedChange={(checked) => {
                                                                            const currentValues = [...(field.value || [])];
                                                                            if (checked) {
                                                                                field.onChange([...currentValues, type.id]);
                                                                            } else {
                                                                                field.onChange(
                                                                                    currentValues.filter((value) => value !== type.id)
                                                                                );
                                                                            }
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="text-sm font-normal cursor-pointer">
                                                                    {type.name}
                                                                </FormLabel>
                                                            </FormItem>
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Description détaillée de la chambre"
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="categories"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Catégories</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Luxe,Vue,Confort"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Séparez les catégories par des virgules
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="tags"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tags</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="jacuzzi,king size,vue mer"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Séparez les tags par des virgules (optionnel)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingRoom ? "Mettre à jour" : "Créer"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}