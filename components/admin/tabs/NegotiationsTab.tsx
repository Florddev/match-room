"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { zodResolver } from "@hookform/resolvers/zod"
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Calendar,
    CalendarDays,
    Check,
    Clock,
    DollarSign,
    Filter,
    Hotel,
    Loader2,
    MessageCircle,
    Pencil,
    Percent,
    Plus,
    Search,
    ThumbsDown,
    ThumbsUp,
    Trash2,
    User,
    X
} from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Label } from "../../ui/label"

// Types pour les négociations et relations
type Room = {
    id: string
    name: string
    price: number
    hotelId: string
}

type User = {
    id: string
    firstname: string
    lastname: string
    email: string
    phone: string
}

type Hotel = {
    id: string
    name: string
    city: string
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
    room: Room & { hotel: Hotel }
    user: User
}

// Schéma de validation pour le formulaire de création/modification de négociation
const negotiationFormSchema = z.object({
    roomId: z.string().min(1, { message: "La chambre est requise" }),
    userId: z.string().min(1, { message: "L'utilisateur est requis" }),
    status: z.string().min(1, { message: "Le statut est requis" }),
    price: z.coerce.number().min(0, { message: "Le prix doit être positif" }),
    startDate: z.string().min(1, { message: "La date de début est requise" }),
    endDate: z.string().min(1, { message: "La date de fin est requise" }),
}).refine(data => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
}, {
    message: "La date de fin doit être postérieure ou égale à la date de début",
    path: ["endDate"],
});

export function NegotiationsTab() {
    const [negotiations, setNegotiations] = useState<Negotiation[]>([])
    const [filteredNegotiations, setFilteredNegotiations] = useState<Negotiation[]>([])
    const [rooms, setRooms] = useState<(Room & { hotel: Hotel })[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [editingNegotiation, setEditingNegotiation] = useState<Negotiation | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    // Filtres et tri
    const [selectedHotelFilter, setSelectedHotelFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [sortField, setSortField] = useState<string>("updatedAt")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)

    // Actions pour une négociation
    const [actionDialogOpen, setActionDialogOpen] = useState(false)
    const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null)
    const [counterOfferPrice, setCounterOfferPrice] = useState<number>(0)

    const form = useForm<z.infer<typeof negotiationFormSchema>>({
        resolver: zodResolver(negotiationFormSchema),
        defaultValues: {
            roomId: "",
            userId: "",
            status: "pending",
            price: 0,
            startDate: "",
            endDate: "",
        },
    });

    // Charger les données
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)

                // Simuler le chargement depuis l'API

                // Simulation des hôtels
                const mockHotels: Hotel[] = [
                    { id: "1", name: "Hôtel Luxor Palace", city: "Paris" },
                    { id: "2", name: "Le Méridien Nice", city: "Nice" },
                    { id: "3", name: "Château Bordeaux", city: "Bordeaux" },
                ];

                // Simulation des chambres
                const mockRooms: (Room & { hotel: Hotel })[] = [
                    {
                        id: "1",
                        name: "Suite Royale",
                        price: 450,
                        hotelId: "1",
                        hotel: mockHotels[0],
                    },
                    {
                        id: "2",
                        name: "Chambre Double Supérieure",
                        price: 180,
                        hotelId: "1",
                        hotel: mockHotels[0],
                    },
                    {
                        id: "3",
                        name: "Suite Vue Mer",
                        price: 320,
                        hotelId: "2",
                        hotel: mockHotels[1],
                    },
                    {
                        id: "4",
                        name: "Chambre Familiale",
                        price: 250,
                        hotelId: "3",
                        hotel: mockHotels[2],
                    },
                ];

                // Simulation des utilisateurs
                const mockUsers: User[] = [
                    {
                        id: "1",
                        firstname: "Sophie",
                        lastname: "Martin",
                        email: "sophie.martin@example.com",
                        phone: "0612345678",
                    },
                    {
                        id: "2",
                        firstname: "Thomas",
                        lastname: "Petit",
                        email: "thomas.petit@example.com",
                        phone: "0723456789",
                    },
                    {
                        id: "3",
                        firstname: "Julie",
                        lastname: "Moreau",
                        email: "julie.moreau@example.com",
                        phone: "0634567890",
                    },
                ];

                // Simulation des négociations
                const today = new Date();
                const mockNegotiations: Negotiation[] = [
                    {
                        id: "1",
                        userId: mockUsers[0].id,
                        roomId: mockRooms[0].id,
                        status: "pending",
                        price: mockRooms[0].price * 0.85, // 15% de réduction demandée
                        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 20).toISOString(),
                        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 25).toISOString(),
                        createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2).toISOString(),
                        updatedAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2).toISOString(),
                        room: mockRooms[0],
                        user: mockUsers[0],
                    },
                    {
                        id: "2",
                        userId: mockUsers[1].id,
                        roomId: mockRooms[2].id,
                        status: "counter",
                        price: mockRooms[2].price * 0.9, // 10% de réduction proposée en contre-offre
                        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15).toISOString(),
                        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 22).toISOString(),
                        createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5).toISOString(),
                        updatedAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3).toISOString(),
                        room: mockRooms[2],
                        user: mockUsers[1],
                    },
                    {
                        id: "3",
                        userId: mockUsers[2].id,
                        roomId: mockRooms[3].id,
                        status: "rejected",
                        price: mockRooms[3].price * 0.7, // 30% de réduction demandée, refusée
                        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10).toISOString(),
                        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14).toISOString(),
                        createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10).toISOString(),
                        updatedAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 8).toISOString(),
                        room: mockRooms[3],
                        user: mockUsers[2],
                    },
                    {
                        id: "4",
                        userId: mockUsers[0].id,
                        roomId: mockRooms[1].id,
                        status: "accepted",
                        price: mockRooms[1].price * 0.85, // 15% de réduction acceptée
                        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5).toISOString(),
                        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10).toISOString(),
                        createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 15).toISOString(),
                        updatedAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 12).toISOString(),
                        room: mockRooms[1],
                        user: mockUsers[0],
                    },
                ];

                setRooms(mockRooms);
                setUsers(mockUsers);
                setNegotiations(mockNegotiations);
                setFilteredNegotiations(mockNegotiations);
            } catch (error) {
                console.error("Erreur lors du chargement des données:", error);
                alert("Impossible de charger les données");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filtrer et trier les négociations
    useEffect(() => {
        let filtered = [...negotiations];

        // Filtre par terme de recherche
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (negotiation) =>
                    negotiation.user.firstname.toLowerCase().includes(term) ||
                    negotiation.user.lastname.toLowerCase().includes(term) ||
                    negotiation.user.email.toLowerCase().includes(term) ||
                    negotiation.room.name.toLowerCase().includes(term) ||
                    negotiation.room.hotel.name.toLowerCase().includes(term) ||
                    negotiation.status.toLowerCase().includes(term)
            );
        }

        // Filtre par hôtel
        if (selectedHotelFilter !== "all") {
            filtered = filtered.filter(negotiation => negotiation.room.hotelId === selectedHotelFilter);
        }

        // Filtre par statut
        if (statusFilter !== "all") {
            filtered = filtered.filter(negotiation => negotiation.status.toLowerCase() === statusFilter);
        }

        // Tri
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortField) {
                case "updatedAt":
                    aValue = new Date(a.updatedAt).getTime();
                    bValue = new Date(b.updatedAt).getTime();
                    break;
                case "createdAt":
                    aValue = new Date(a.createdAt).getTime();
                    bValue = new Date(b.createdAt).getTime();
                    break;
                case "startDate":
                    aValue = new Date(a.startDate).getTime();
                    bValue = new Date(b.startDate).getTime();
                    break;
                case "discount":
                    aValue = (a.room.price - a.price) / a.room.price;
                    bValue = (b.room.price - b.price) / b.room.price;
                    break;
                case "price":
                    aValue = a.price;
                    bValue = b.price;
                    break;
                case "status":
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case "clientName":
                    aValue = `${a.user.lastname} ${a.user.firstname}`;
                    bValue = `${b.user.lastname} ${b.user.firstname}`;
                    break;
                case "hotelName":
                    aValue = a.room.hotel.name;
                    bValue = b.room.hotel.name;
                    break;
                default:
                    aValue = new Date(a.updatedAt).getTime();
                    bValue = new Date(b.updatedAt).getTime();
            }

            if (sortDirection === "asc") {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredNegotiations(filtered);
    }, [searchTerm, selectedHotelFilter, statusFilter, sortField, sortDirection, negotiations]);

    // Gérer la création ou la mise à jour d'une négociation
    const handleSubmit = async (values: z.infer<typeof negotiationFormSchema>) => {
        try {
            setIsSubmitting(true);

            // Trouver la chambre et l'utilisateur
            const room = rooms.find(r => r.id === values.roomId);
            const user = users.find(u => u.id === values.userId);

            if (!room || !user) {
                alert("Chambre ou utilisateur introuvable");
                setIsSubmitting(false);
                return;
            }

            // Si on modifie une négociation existante
            if (editingNegotiation) {
                // Simulation de mise à jour (à remplacer par l'appel API)

                // Mise à jour locale
                const updatedNegotiations = negotiations.map(negotiation => {
                    if (negotiation.id === editingNegotiation.id) {
                        return {
                            ...negotiation,
                            ...values,
                            room,
                            user,
                            updatedAt: new Date().toISOString()
                        };
                    }
                    return negotiation;
                });

                setNegotiations(updatedNegotiations);
                alert(`La négociation pour ${user.firstname} ${user.lastname} a été mise à jour.`);
            } else {
                // Simulation de création (à remplacer par l'appel API)

                // Création locale avec ID fictif
                const newId = `new-${Date.now()}`;

                const newNegotiation: Negotiation = {
                    id: newId,
                    ...values,
                    room,
                    user,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                setNegotiations([...negotiations, newNegotiation]);
                alert(`La négociation pour ${user.firstname} ${user.lastname} a été créée avec succès.`);
            }

            // Réinitialiser le formulaire et fermer le dialogue
            form.reset();
            setIsDialogOpen(false);
            setEditingNegotiation(null);
            setIsCreating(false);
        } catch (error) {
            console.error("Erreur lors de l'enregistrement de la négociation:", error);
            alert("Une erreur est survenue lors de l'enregistrement des données.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Gérer la suppression d'une négociation
    const handleDelete = async (id: string) => {
        try {
            // Simulation de suppression (à remplacer par l'appel API)

            // Suppression locale
            setNegotiations(negotiations.filter(negotiation => negotiation.id !== id));
            setDeleteConfirmId(null);

            alert("La négociation a été supprimée avec succès.");
        } catch (error) {
            console.error("Erreur lors de la suppression de la négociation:", error);
            alert("Impossible de supprimer la négociation.");
        }
    };

    // Gérer les actions sur une négociation (accepter, refuser, contre-offre)
    const handleNegotiationAction = async (negotiationId: string, action: 'accept' | 'reject' | 'counter', price?: number) => {
        try {
            // Trouver la négociation
            const negotiation = negotiations.find(n => n.id === negotiationId);

            if (!negotiation) {
                alert("Négociation introuvable");
                return;
            }

            let newStatus = '';
            let newPrice = negotiation.price;

            switch (action) {
                case 'accept':
                    newStatus = 'accepted';
                    break;
                case 'reject':
                    newStatus = 'rejected';
                    break;
                case 'counter':
                    newStatus = 'counter';
                    if (price) {
                        newPrice = price;
                    }
                    break;
            }

            // Simulation de mise à jour (à remplacer par l'appel API)

            // Mise à jour locale
            const updatedNegotiations = negotiations.map(n => {
                if (n.id === negotiationId) {
                    return {
                        ...n,
                        status: newStatus,
                        price: newPrice,
                        updatedAt: new Date().toISOString()
                    };
                }
                return n;
            });

            setNegotiations(updatedNegotiations);

            // Messages de confirmation
            const messages = {
                accept: "Négociation acceptée avec succès.",
                reject: "Négociation refusée.",
                counter: "Contre-proposition envoyée avec succès."
            };

            alert(messages[action]);
            setActionDialogOpen(false);
            setSelectedNegotiation(null);

        } catch (error) {
            console.error("Erreur lors de l'action sur la négociation:", error);
            alert("Une erreur est survenue.");
        }
    };

    // Ouvrir le dialogue d'action
    const openActionDialog = (negotiation: Negotiation) => {
        setSelectedNegotiation(negotiation);
        setCounterOfferPrice(negotiation.price);
        setActionDialogOpen(true);
    };

    // Ouvrir le formulaire pour édition
    const openEditForm = (negotiation: Negotiation) => {
        setEditingNegotiation(negotiation);
        form.reset({
            roomId: negotiation.roomId,
            userId: negotiation.userId,
            status: negotiation.status,
            price: negotiation.price,
            startDate: negotiation.startDate.split('T')[0], // Format YYYY-MM-DD pour l'input date
            endDate: negotiation.endDate.split('T')[0],
        });
        setIsDialogOpen(true);
    };

    // Ouvrir le formulaire pour création
    const openCreateForm = () => {
        setEditingNegotiation(null);
        setIsCreating(true);

        // Date du jour et date du lendemain pour les valeurs par défaut
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        form.reset({
            roomId: "",
            userId: "",
            status: "pending",
            price: 0,
            startDate: today.toISOString().split('T')[0],
            endDate: tomorrow.toISOString().split('T')[0],
        });

        setIsDialogOpen(true);
    };

    // Fonctions pour manipuler les dates
    function formatDate(dateString: string) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (error) {
            return "Date invalide";
        }
    }

    function calculateStayDuration(startDateStr: string, endDateStr: string) {
        try {
            const start = new Date(startDateStr);
            const end = new Date(endDateStr);

            // Calculer la différence en millisecondes
            const diffTime = Math.abs(end.getTime() - start.getTime());
            // Convertir en jours et ajouter 1 (pour inclure le jour de départ)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            return diffDays;
        } catch (error) {
            return 0;
        }
    }

    // Calculer le pourcentage de réduction
    const calculateDiscount = (originalPrice: number, proposedPrice: number) => {
        if (originalPrice <= 0 || proposedPrice <= 0) return 0;
        return ((originalPrice - proposedPrice) / originalPrice) * 100;
    };

    // Obtenez la couleur en fonction du statut
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "counter":
                return "bg-blue-100 text-blue-800";
            case "accepted":
                return "bg-green-100 text-green-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Obtenir l'icône en fonction du statut
    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending":
                return <Clock className="h-4 w-4" />;
            case "counter":
                return <MessageCircle className="h-4 w-4" />;
            case "accepted":
                return <ThumbsUp className="h-4 w-4" />;
            case "rejected":
                return <ThumbsDown className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    // Gestion du tri
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    // Composant pour l'en-tête de colonne triable
    const SortableHeader = ({ field, children }: { field: string, children: React.ReactNode }) => (
        <th
            className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted/60"
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center">
                {children}
                <span className="ml-1">
                    {sortField === field ? (
                        sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                        <ArrowUpDown className="h-3 w-3" />
                    )}
                </span>
            </div>
        </th>
    );

    return (
        <div className="space-y-4">
            {/* Barre d'outils et recherche */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Rechercher une négociation..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        Filtres
                    </Button>
                    <Button onClick={openCreateForm}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouvelle négociation
                    </Button>
                </div>
            </div>

            {/* Panneau de filtres */}
            {isFilterPanelOpen && (
                <Card className="p-4">
                    <CardContent className="p-0 flex flex-wrap gap-4">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium mb-2">Hôtel</span>
                            <Select value={selectedHotelFilter} onValueChange={setSelectedHotelFilter}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Tous les hôtels" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les hôtels</SelectItem>
                                    {rooms
                                        .map(room => room.hotel)
                                        .filter((hotel, index, self) =>
                                            index === self.findIndex(h => h.id === hotel.id)
                                        )
                                        .map(hotel => (
                                            <SelectItem key={hotel.id} value={hotel.id}>
                                                {hotel.name}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-sm font-medium mb-2">Statut</span>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Tous les statuts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    <SelectItem value="pending">En attente</SelectItem>
                                    <SelectItem value="counter">Contre-proposition</SelectItem>
                                    <SelectItem value="accepted">Acceptée</SelectItem>
                                    <SelectItem value="rejected">Refusée</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-sm font-medium mb-2">Trier par</span>
                            <Select value={sortField} onValueChange={setSortField}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Trier par" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="updatedAt">Dernière mise à jour</SelectItem>
                                    <SelectItem value="createdAt">Date de création</SelectItem>
                                    <SelectItem value="startDate">Date d'arrivée</SelectItem>
                                    <SelectItem value="discount">Réduction %</SelectItem>
                                    <SelectItem value="price">Prix proposé</SelectItem>
                                    <SelectItem value="status">Statut</SelectItem>
                                    <SelectItem value="clientName">Nom du client</SelectItem>
                                    <SelectItem value="hotelName">Nom de l'hôtel</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-sm font-medium mb-2">Ordre</span>
                            <Select value={sortDirection} onValueChange={(value: any) => setSortDirection(value)}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Ordre de tri" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="asc">Croissant</SelectItem>
                                    <SelectItem value="desc">Décroissant</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Nombre de résultats et informations */}
            <div className="text-sm text-muted-foreground">
                {filteredNegotiations.length} négociation{filteredNegotiations.length !== 1 ? "s" : ""}
            </div>

            {/* Liste des négociations */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredNegotiations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <p className="text-muted-foreground mb-2">Aucune négociation trouvée</p>
                    <Button variant="outline" onClick={openCreateForm}>
                        <Plus className="mr-2 h-4 w-4" />
                        Créer une négociation
                    </Button>
                </div>
            ) : (
                <div className="border rounded-md overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <SortableHeader field="clientName">Client</SortableHeader>
                                <SortableHeader field="hotelName">Chambre</SortableHeader>
                                <SortableHeader field="startDate">Période</SortableHeader>
                                <SortableHeader field="price">Prix</SortableHeader>
                                <SortableHeader field="discount">Réduction</SortableHeader>
                                <SortableHeader field="status">Statut</SortableHeader>
                                <SortableHeader field="updatedAt">Date</SortableHeader>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredNegotiations.map((negotiation) => {
                                const originalPrice = negotiation.room.price;
                                const discountPercentage = calculateDiscount(originalPrice, negotiation.price);

                                return (
                                    <tr key={negotiation.id} className="border-t">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{negotiation.user.lastname} {negotiation.user.firstname}</div>
                                            <div className="text-sm text-muted-foreground">{negotiation.user.email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">
                                                {negotiation.room.name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {negotiation.room.hotel.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                                                <span>{formatDate(negotiation.startDate)} - {formatDate(negotiation.endDate)}</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {calculateStayDuration(negotiation.startDate, negotiation.endDate)} nuit(s)
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center font-medium">
                                                <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                                                {negotiation.price.toFixed(2)} €
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center">
                                                <span className="line-through">{originalPrice.toFixed(2)} €</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium flex items-center">
                                                <Percent className="h-4 w-4 mr-1 text-gray-500" />
                                                {discountPercentage.toFixed(0)}%
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={`flex items-center gap-1 ${getStatusColor(negotiation.status)}`}>
                                                {getStatusIcon(negotiation.status)}
                                                {negotiation.status.charAt(0).toUpperCase() + negotiation.status.slice(1)}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm">
                                                {new Date(negotiation.updatedAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(negotiation.updatedAt).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end items-center space-x-2">
                                                {(negotiation.status === "pending" || negotiation.status === "counter") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8"
                                                        onClick={() => openActionDialog(negotiation)}
                                                    >
                                                        <MessageCircle className="h-4 w-4 mr-1" />
                                                        Action
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditForm(negotiation)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => setDeleteConfirmId(negotiation.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>

                                                {/* Confirmation de suppression */}
                                                {deleteConfirmId === negotiation.id && (
                                                    <div className="absolute bg-background border rounded-md p-2 shadow-md flex items-center gap-2">
                                                        <span className="text-sm">Confirmer ?</span>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => handleDelete(negotiation.id)}
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
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de création/édition */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingNegotiation ? "Modifier une négociation" : "Créer une négociation"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingNegotiation
                                ? "Modifiez les informations de la négociation ci-dessous."
                                : "Remplissez les informations pour créer une nouvelle négociation."}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="userId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner un client" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {users.map((user) => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.lastname} {user.firstname} ({user.email})
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
                                name="roomId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Chambre</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(value);

                                                // Mettre à jour le prix proposé avec une réduction par défaut de 10%
                                                const selectedRoom = rooms.find(r => r.id === value);
                                                if (selectedRoom) {
                                                    const discountedPrice = selectedRoom.price * 0.9;
                                                    form.setValue("price", discountedPrice);
                                                }
                                            }}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner une chambre" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {rooms.map((room) => (
                                                    <SelectItem key={room.id} value={room.id}>
                                                        {room.hotel.name} - {room.name} ({room.price} € / nuit)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date d'arrivée</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center">
                                                    <CalendarDays className="absolute ml-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                    <Input
                                                        {...field}
                                                        type="date"
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date de départ</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center">
                                                    <CalendarDays className="absolute ml-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                    <Input
                                                        {...field}
                                                        type="date"
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Prix proposé</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center">
                                                    <DollarSign className="absolute ml-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="pl-10"
                                                    />
                                                    <span className="absolute right-3">€</span>
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                {form.getValues("roomId") && (
                                                    <div className="flex items-center mt-1 text-xs">
                                                        <span>
                                                            Prix original: {
                                                                (() => {
                                                                    const roomId = form.getValues("roomId");
                                                                    const selectedRoom = rooms.find(r => r.id === roomId);
                                                                    return selectedRoom ? `${selectedRoom.price.toFixed(2)} €` : "N/A";
                                                                })()
                                                            }
                                                        </span>
                                                        <span className="ml-2">
                                                            Réduction: {
                                                                (() => {
                                                                    const roomId = form.getValues("roomId");
                                                                    const price = form.getValues("price");
                                                                    const selectedRoom = rooms.find(r => r.id === roomId);
                                                                    if (selectedRoom && price) {
                                                                        return `${calculateDiscount(selectedRoom.price, price).toFixed(0)}%`;
                                                                    }
                                                                    return "0%";
                                                                })()
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Statut</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner un statut" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="pending">En attente</SelectItem>
                                                    <SelectItem value="counter">Contre-proposition</SelectItem>
                                                    <SelectItem value="accepted">Acceptée</SelectItem>
                                                    <SelectItem value="rejected">Refusée</SelectItem>
                                                </SelectContent>
                                            </Select>
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
                                    {editingNegotiation ? "Mettre à jour" : "Créer"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Modal d'actions pour les négociations en attente ou contre-proposition */}
            <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Gérer la négociation</DialogTitle>
                        <DialogDescription>
                            Accepter, refuser ou faire une contre-proposition
                        </DialogDescription>
                    </DialogHeader>

                    {selectedNegotiation && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Client</span>
                                    <span className="mt-1">{selectedNegotiation.user.firstname} {selectedNegotiation.user.lastname}</span>
                                    <span className="text-xs text-muted-foreground">{selectedNegotiation.user.email}</span>
                                </div>

                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Chambre</span>
                                    <span className="mt-1">{selectedNegotiation.room.name}</span>
                                    <span className="text-xs text-muted-foreground">{selectedNegotiation.room.hotel.name}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Période</span>
                                    <span className="mt-1">
                                        {formatDate(selectedNegotiation.startDate)} - {formatDate(selectedNegotiation.endDate)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {calculateStayDuration(selectedNegotiation.startDate, selectedNegotiation.endDate)} nuit(s)
                                    </span>
                                </div>

                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Statut actuel</span>
                                    <Badge className={`mt-1 w-fit ${getStatusColor(selectedNegotiation.status)}`}>
                                        {selectedNegotiation.status.charAt(0).toUpperCase() + selectedNegotiation.status.slice(1)}
                                    </Badge>
                                </div>
                            </div>

                            <div className="border-t border-b py-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Prix original</span>
                                        <span className="mt-1">{selectedNegotiation.room.price.toFixed(2)} € / nuit</span>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-medium">Prix proposé</span>
                                        <div className="flex items-center mt-1">
                                            <span className="font-bold">{selectedNegotiation.price.toFixed(2)} € / nuit</span>
                                            <Badge variant="outline" className="ml-2">
                                                -{calculateDiscount(selectedNegotiation.room.price, selectedNegotiation.price).toFixed(0)}%
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 mt-4">
                                    <div className="flex flex-col">
                                        <Label htmlFor="counterPrice">Contre-proposition (€ / nuit)</Label>
                                        <div className="flex items-center mt-1">
                                            <DollarSign className="absolute ml-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                            <Input
                                                id="counterPrice"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={counterOfferPrice}
                                                onChange={(e) => setCounterOfferPrice(parseFloat(e.target.value))}
                                                className="pl-10"
                                            />
                                            <span className="absolute right-[13rem] flex items-center text-sm">
                                                <Percent className="h-3.5 w-3.5 mr-1" />
                                                {calculateDiscount(selectedNegotiation.room.price, counterOfferPrice).toFixed(0)}% de réduction
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="space-x-2">
                                    <Button
                                        variant="default"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleNegotiationAction(selectedNegotiation.id, 'accept')}
                                    >
                                        <ThumbsUp className="h-4 w-4 mr-1" />
                                        Accepter
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                        onClick={() => handleNegotiationAction(selectedNegotiation.id, 'counter', counterOfferPrice)}
                                        disabled={!counterOfferPrice}
                                    >
                                        <MessageCircle className="h-4 w-4 mr-1" />
                                        Contre-proposition
                                    </Button>
                                </div>
                                <Button
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleNegotiationAction(selectedNegotiation.id, 'reject')}
                                >
                                    <ThumbsDown className="h-4 w-4 mr-1" />
                                    Refuser
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}