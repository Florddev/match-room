"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
    Form, FormControl,
    FormField,
    FormItem, FormLabel, FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Loader2, MapPin, Pencil, Phone, Plus, Search, Star, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

// Type pour les hôtels
type Hotel = {
    id: string
    name: string
    rate: number
    address: string
    city: string
    zipCode: string
    phone: string
    createdAt: string
    updatedAt: string
    rooms: {
        id: string
    }[]
}

// Schéma de validation pour le formulaire de création/modification d'hôtel
const hotelFormSchema = z.object({
    name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
    rate: z.coerce.number().min(0).max(5, { message: "La note doit être comprise entre 0 et 5" }),
    address: z.string().min(5, { message: "L'adresse doit contenir au moins 5 caractères" }),
    city: z.string().min(2, { message: "La ville doit contenir au moins 2 caractères" }),
    zipCode: z.string().min(3, { message: "Le code postal doit contenir au moins 3 caractères" }),
    phone: z.string().min(5, { message: "Le numéro de téléphone doit contenir au moins 5 caractères" }),
});

export function HotelsTab() {
    const [hotels, setHotels] = useState<Hotel[]>([])
    const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [editingHotel, setEditingHotel] = useState<Hotel | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

    const form = useForm<z.infer<typeof hotelFormSchema>>({
        resolver: zodResolver(hotelFormSchema),
        defaultValues: {
            name: "",
            rate: 0,
            address: "",
            city: "",
            zipCode: "",
            phone: "",
        },
    });

    // Charger la liste des hôtels
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)

                // Simuler le chargement depuis l'API - à remplacer par votre propre API
                // Exemple: const response = await fetch("/api/admin/hotels")

                // Simulation de données d'hôtels
                const mockHotels: Hotel[] = [
                    {
                        id: "1",
                        name: "Hôtel Luxor Palace",
                        rate: 4.8,
                        address: "1 Place Vendôme",
                        city: "Paris",
                        zipCode: "75001",
                        phone: "0143123456",
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        rooms: Array(8).fill(0).map((_, i) => ({ id: `room-${i + 1}-hotel-1` }))
                    },
                    {
                        id: "2",
                        name: "Le Méridien Nice",
                        rate: 4.5,
                        address: "12 Promenade des Anglais",
                        city: "Nice",
                        zipCode: "06000",
                        phone: "0493456789",
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        rooms: Array(6).fill(0).map((_, i) => ({ id: `room-${i + 1}-hotel-2` }))
                    },
                    {
                        id: "3",
                        name: "Château Bordeaux",
                        rate: 4.3,
                        address: "58 Quai des Chartrons",
                        city: "Bordeaux",
                        zipCode: "33000",
                        phone: "0556789012",
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        rooms: Array(5).fill(0).map((_, i) => ({ id: `room-${i + 1}-hotel-3` }))
                    },
                    {
                        id: "4",
                        name: "Les Suites de Marseille",
                        rate: 4.1,
                        address: "23 Boulevard du Front de Mer",
                        city: "Marseille",
                        zipCode: "13008",
                        phone: "0491234567",
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        rooms: Array(4).fill(0).map((_, i) => ({ id: `room-${i + 1}-hotel-4` }))
                    },
                    {
                        id: "5",
                        name: "Le Grand Lyon",
                        rate: 4.6,
                        address: "12 Place Bellecour",
                        city: "Lyon",
                        zipCode: "69002",
                        phone: "0472123456",
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        rooms: Array(7).fill(0).map((_, i) => ({ id: `room-${i + 1}-hotel-5` }))
                    },
                ];

                setHotels(mockHotels);
                setFilteredHotels(mockHotels);
            } catch (error) {
                console.error("Erreur lors du chargement des hôtels:", error);
                alert("Impossible de charger les hôtels");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filtrer les hôtels en fonction du terme de recherche
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredHotels(hotels);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = hotels.filter(
            (hotel) =>
                hotel.name.toLowerCase().includes(term) ||
                hotel.address.toLowerCase().includes(term) ||
                hotel.city.toLowerCase().includes(term) ||
                hotel.zipCode.includes(term) ||
                hotel.phone.includes(term)
        );

        setFilteredHotels(filtered);
    }, [searchTerm, hotels]);

    // Gérer la création ou la mise à jour d'un hôtel
    const handleSubmit = async (values: z.infer<typeof hotelFormSchema>) => {
        try {
            setIsSubmitting(true);

            // Si on modifie un hôtel existant
            if (editingHotel) {
                // Simulation de mise à jour (à remplacer par l'appel API)
                // await fetch(`/api/admin/hotels/${editingHotel.id}`, { method: "PUT", body: JSON.stringify(values) })

                // Mise à jour locale
                const updatedHotels = hotels.map(hotel =>
                    hotel.id === editingHotel.id ? {
                        ...hotel,
                        ...values
                    } : hotel
                );

                setHotels(updatedHotels);
                alert(`Les informations de l'hôtel ${values.name} ont été mises à jour.`);
            } else {
                // Simulation de création (à remplacer par l'appel API)
                // const response = await fetch("/api/admin/hotels", { method: "POST", body: JSON.stringify(values) })

                // Création locale avec ID fictif
                const newHotel: Hotel = {
                    id: `new-${Date.now()}`,
                    ...values,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    rooms: []
                };

                setHotels([...hotels, newHotel]);
                alert(`L'hôtel ${values.name} a été créé avec succès.`);
            }

            // Réinitialiser le formulaire et fermer le dialogue
            form.reset();
            setIsDialogOpen(false);
            setEditingHotel(null);
            setIsCreating(false);
        } catch (error) {
            console.error("Erreur lors de l'enregistrement de l'hôtel:", error);
            alert("Une erreur est survenue lors de l'enregistrement des données.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Gérer la suppression d'un hôtel
    const handleDelete = async (id: string) => {
        try {
            // Vérifier si l'hôtel a des chambres
            const hotelToDelete = hotels.find(hotel => hotel.id === id);

            if (hotelToDelete && hotelToDelete.rooms.length > 0) {
                if (!confirm(`Cet hôtel possède ${hotelToDelete.rooms.length} chambre(s). Êtes-vous sûr de vouloir le supprimer ainsi que toutes ses chambres ?`)) {
                    setDeleteConfirmId(null);
                    return;
                }
            }

            // Simulation de suppression (à remplacer par l'appel API)
            // await fetch(`/api/admin/hotels/${id}`, { method: "DELETE" })

            // Suppression locale
            setHotels(hotels.filter(hotel => hotel.id !== id));
            setDeleteConfirmId(null);

            alert("L'hôtel a été supprimé avec succès.");
        } catch (error) {
            console.error("Erreur lors de la suppression de l'hôtel:", error);
            alert("Impossible de supprimer l'hôtel.");
        }
    };

    // Ouvrir le formulaire pour édition
    const openEditForm = (hotel: Hotel) => {
        setEditingHotel(hotel);
        form.reset({
            name: hotel.name,
            rate: hotel.rate,
            address: hotel.address,
            city: hotel.city,
            zipCode: hotel.zipCode,
            phone: hotel.phone,
        });
        setIsDialogOpen(true);
    };

    // Ouvrir le formulaire pour création
    const openCreateForm = () => {
        setEditingHotel(null);
        form.reset({
            name: "",
            rate: 0,
            address: "",
            city: "",
            zipCode: "",
            phone: "",
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

    // Rendu des hôtels en mode liste
    const renderHotelTable = () => {
        return (
            <div className="border rounded-md overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Note</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Emplacement</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Téléphone</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Chambres</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredHotels.map((hotel) => (
                            <tr key={hotel.id} className="border-t">
                                <td className="px-4 py-3 font-medium">{hotel.name}</td>
                                <td className="px-4 py-3">{renderStars(hotel.rate)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                                        {hotel.city}, {hotel.zipCode}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center">
                                        <Phone className="h-4 w-4 mr-1 text-gray-500" />
                                        {hotel.phone}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant="outline">{hotel.rooms.length}</Badge>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end items-center space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditForm(hotel)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => setDeleteConfirmId(hotel.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>

                                        {/* Confirmation de suppression */}
                                        {deleteConfirmId === hotel.id && (
                                            <div className="absolute bg-background border rounded-md p-2 shadow-md flex items-center gap-2">
                                                <span className="text-sm">Confirmer ?</span>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => handleDelete(hotel.id)}
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

    // Rendu des hôtels en mode grille
    const renderHotelGrid = () => {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHotels.map((hotel) => (
                    <Card key={hotel.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{hotel.name}</CardTitle>
                                <div className="flex">
                                    {renderStars(hotel.rate)}
                                </div>
                            </div>
                            <CardDescription className="flex items-center">
                                <MapPin className="h-3.5 w-3.5 mr-1" />
                                {hotel.address}, {hotel.city} {hotel.zipCode}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Phone className="h-3.5 w-3.5 mr-1" />
                                    {hotel.phone}
                                </div>
                                <Badge variant="outline" className="ml-2">
                                    {hotel.rooms.length} chambre{hotel.rooms.length > 1 ? "s" : ""}
                                </Badge>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-background"
                                onClick={() => openEditForm(hotel)}
                            >
                                <Pencil className="h-4 w-4 mr-1" />
                                Modifier
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-background"
                                onClick={() => setDeleteConfirmId(hotel.id)}
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Supprimer
                            </Button>

                            {/* Confirmation de suppression */}
                            {deleteConfirmId === hotel.id && (
                                <div className="absolute bottom-20 right-4 bg-background border rounded-md p-2 shadow-md flex items-center gap-2">
                                    <span className="text-sm">Confirmer ?</span>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleDelete(hotel.id)}
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
                        placeholder="Rechercher un hôtel..."
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
                        Nouvel hôtel
                    </Button>
                </div>
            </div>

            {/* Liste des hôtels */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredHotels.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <p className="text-muted-foreground mb-2">Aucun hôtel trouvé</p>
                    <Button variant="outline" onClick={openCreateForm}>
                        <Plus className="mr-2 h-4 w-4" />
                        Créer un hôtel
                    </Button>
                </div>
            ) : (
                viewMode === "grid" ? renderHotelGrid() : renderHotelTable()
            )}

            {/* Modal de création/édition */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingHotel ? "Modifier un hôtel" : "Créer un hôtel"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingHotel
                                ? "Modifiez les informations de l'hôtel ci-dessous."
                                : "Remplissez les informations pour créer un nouvel hôtel."}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom de l'hôtel</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Grand Hôtel" {...field} />
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

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adresse</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123 rue Principale" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ville</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Paris" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="zipCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Code postal</FormLabel>
                                            <FormControl>
                                                <Input placeholder="75001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Téléphone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="01 23 45 67 89" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                                    {editingHotel ? "Mettre à jour" : "Créer"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}