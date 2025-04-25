"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
    Form, FormControl, FormField,
    FormItem, FormLabel, FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { Bed, Check, Hash, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

// Type pour les types de chambre
type RoomType = {
    id: string
    name: string
    roomCount?: number // Nombre de chambres associées à ce type
}

// Schéma de validation pour le formulaire
const typeFormSchema = z.object({
    name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
});

export function TypesTab() {
    const [types, setTypes] = useState<RoomType[]>([])
    const [filteredTypes, setFilteredTypes] = useState<RoomType[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [editingType, setEditingType] = useState<RoomType | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    const form = useForm<z.infer<typeof typeFormSchema>>({
        resolver: zodResolver(typeFormSchema),
        defaultValues: {
            name: "",
        },
    });

    // Charger les types de chambre
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)

                // Simuler le chargement depuis l'API - à remplacer par votre propre API

                // Simulation de données
                const mockTypes: RoomType[] = [
                    { id: "1", name: "Suite", roomCount: 8 },
                    { id: "2", name: "Simple", roomCount: 12 },
                    { id: "3", name: "Double", roomCount: 15 },
                    { id: "4", name: "Familiale", roomCount: 6 },
                    { id: "5", name: "Prestige", roomCount: 4 }
                ];

                setTypes(mockTypes);
                setFilteredTypes(mockTypes);
            } catch (error) {
                console.error("Erreur lors du chargement des types:", error);
                alert("Impossible de charger les types de chambre");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filtrer les types en fonction du terme de recherche
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredTypes(types);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = types.filter(
            (type) => type.name.toLowerCase().includes(term)
        );

        setFilteredTypes(filtered);
    }, [searchTerm, types]);

    // Gérer la création ou la mise à jour d'un type
    const handleSubmit = async (values: z.infer<typeof typeFormSchema>) => {
        try {
            setIsSubmitting(true);

            // Si on modifie un type existant
            if (editingType) {
                // Simulation de mise à jour (à remplacer par l'appel API)

                // Mise à jour locale
                const updatedTypes = types.map(type =>
                    type.id === editingType.id ? {
                        ...type,
                        ...values
                    } : type
                );

                setTypes(updatedTypes);
                alert(`Le type ${values.name} a été mis à jour.`);
            } else {
                // Simulation de création (à remplacer par l'appel API)

                // Création locale avec ID fictif
                const newType: RoomType = {
                    id: `new-${Date.now()}`,
                    ...values,
                    roomCount: 0
                };

                setTypes([...types, newType]);
                alert(`Le type ${values.name} a été créé avec succès.`);
            }

            // Réinitialiser le formulaire et fermer le dialogue
            form.reset();
            setIsDialogOpen(false);
            setEditingType(null);
        } catch (error) {
            console.error("Erreur lors de l'enregistrement du type:", error);
            alert("Une erreur est survenue lors de l'enregistrement des données.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Gérer la suppression d'un type
    const handleDelete = async (id: string) => {
        try {
            // Vérifier si le type est utilisé par des chambres
            const typeToDelete = types.find(type => type.id === id);

            if (typeToDelete && typeToDelete.roomCount && typeToDelete.roomCount > 0) {
                if (!confirm(`Ce type est utilisé par ${typeToDelete.roomCount} chambre(s). Êtes-vous sûr de vouloir le supprimer ?`)) {
                    setDeleteConfirmId(null);
                    return;
                }
            }

            // Simulation de suppression (à remplacer par l'appel API)

            // Suppression locale
            setTypes(types.filter(type => type.id !== id));
            setDeleteConfirmId(null);

            alert("Le type a été supprimé avec succès.");
        } catch (error) {
            console.error("Erreur lors de la suppression du type:", error);
            alert("Impossible de supprimer le type.");
        }
    };

    // Ouvrir le formulaire pour édition
    const openEditForm = (type: RoomType) => {
        setEditingType(type);
        form.reset({
            name: type.name,
        });
        setIsDialogOpen(true);
    };

    // Ouvrir le formulaire pour création
    const openCreateForm = () => {
        setEditingType(null);
        form.reset({
            name: "",
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-4">
            {/* Barre d'outils et recherche */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Rechercher un type..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={openCreateForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau type
                </Button>
            </div>

            {/* Liste des types */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredTypes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <p className="text-muted-foreground mb-2">Aucun type trouvé</p>
                    <Button variant="outline" onClick={openCreateForm}>
                        <Plus className="mr-2 h-4 w-4" />
                        Créer un type
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTypes.map((type) => (
                        <Card key={type.id} className="overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xl font-bold">
                                    <div className="flex items-center">
                                        <Bed className="h-5 w-5 mr-2 text-primary" />
                                        {type.name}
                                    </div>
                                </CardTitle>
                                <Badge variant="outline" className="text-sm">
                                    <Hash className="h-3.5 w-3.5 mr-1" />
                                    {type.roomCount || 0} chambre{(type.roomCount !== 1) ? 's' : ''}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-end space-x-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditForm(type)}
                                    >
                                        <Pencil className="h-4 w-4 mr-1" />
                                        Modifier
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive border-destructive hover:bg-destructive/10"
                                        onClick={() => setDeleteConfirmId(type.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Supprimer
                                    </Button>

                                    {/* Confirmation de suppression */}
                                    {deleteConfirmId === type.id && (
                                        <div className="absolute bg-background border rounded-md p-2 shadow-md flex items-center gap-2">
                                            <span className="text-sm">Confirmer ?</span>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => handleDelete(type.id)}
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
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal de création/édition */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingType ? "Modifier un type" : "Créer un type"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingType
                                ? "Modifiez le nom du type de chambre ci-dessous."
                                : "Entrez le nom du nouveau type de chambre."}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom du type</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Suite, Simple, Double, etc." {...field} />
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
                                    {editingType ? "Mettre à jour" : "Créer"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}