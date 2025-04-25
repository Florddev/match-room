"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

// Type pour les utilisateurs
type Role = {
    id: string
    name: string
}

type User = {
    id: string
    firstname: string
    lastname: string
    email: string
    address: string
    city: string
    zipCode: string
    phone: string
    siret?: string
    roleId: string
    role: Role
    createdAt: string
    updatedAt: string
}

// Schéma de validation pour le formulaire de création/modification d'utilisateur
const userFormSchema = z.object({
    firstname: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères" }),
    lastname: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
    email: z.string().email({ message: "Adresse email invalide" }),
    password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }).optional(),
    address: z.string().min(5, { message: "L'adresse doit contenir au moins 5 caractères" }),
    city: z.string().min(2, { message: "La ville doit contenir au moins 2 caractères" }),
    zipCode: z.string().min(3, { message: "Le code postal doit contenir au moins 3 caractères" }),
    phone: z.string().min(5, { message: "Le numéro de téléphone doit contenir au moins 5 caractères" }),
    roleId: z.string().min(1, { message: "Le rôle est requis" }),
    isProfessional: z.boolean().default(false),
    siret: z.string().optional(),
}).refine(
    data => !data.isProfessional || (data.isProfessional && data.siret && data.siret.length >= 14),
    {
        message: "Le numéro SIRET est requis pour les comptes professionnels et doit contenir 14 chiffres",
        path: ["siret"],
    }
);

export function UsersTab() {
    const [users, setUsers] = useState<User[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    const form = useForm<z.infer<typeof userFormSchema>>({
        resolver: zodResolver(userFormSchema),
        defaultValues: {
            firstname: "",
            lastname: "",
            email: "",
            password: "",
            address: "",
            city: "",
            zipCode: "",
            phone: "",
            roleId: "",
            isProfessional: false,
            siret: "",
        },
    });

    const isProfessional = form.watch("isProfessional");

    // Charger la liste des utilisateurs et les rôles
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)

                // Simuler le chargement depuis l'API - à remplacer par votre propre API
                // Exemple: const response = await fetch("/api/admin/users")

                // Simulation de données d'utilisateurs
                const mockUsers: User[] = [
                    {
                        id: "1",
                        firstname: "Admin",
                        lastname: "System",
                        email: "admin@hotelapp.com",
                        address: "123 Admin Street",
                        city: "Paris",
                        zipCode: "75000",
                        phone: "0123456789",
                        roleId: "1",
                        role: { id: "1", name: "ADMIN" },
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        id: "2",
                        firstname: "Jean",
                        lastname: "Dupont",
                        email: "jean.dupont@hotelapp.com",
                        address: "15 Boulevard Haussmann",
                        city: "Paris",
                        zipCode: "75008",
                        phone: "0687654321",
                        siret: "12345678901234",
                        roleId: "2",
                        role: { id: "2", name: "MANAGER" },
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        id: "3",
                        firstname: "Marie",
                        lastname: "Laurent",
                        email: "marie.laurent@hotelapp.com",
                        address: "42 Avenue de la République",
                        city: "Lyon",
                        zipCode: "69002",
                        phone: "0789012345",
                        siret: "98765432109876",
                        roleId: "2",
                        role: { id: "2", name: "MANAGER" },
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        id: "4",
                        firstname: "Sophie",
                        lastname: "Martin",
                        email: "sophie.martin@example.com",
                        address: "8 Rue du Commerce",
                        city: "Bordeaux",
                        zipCode: "33000",
                        phone: "0612345678",
                        roleId: "3",
                        role: { id: "3", name: "CLIENT" },
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                ];

                // Simulation de roles
                const mockRoles: Role[] = [
                    { id: "1", name: "ADMIN" },
                    { id: "2", name: "MANAGER" },
                    { id: "3", name: "CLIENT" },
                ];

                setUsers(mockUsers);
                setFilteredUsers(mockUsers);
                setRoles(mockRoles);
            } catch (error) {
                console.error("Erreur lors du chargement des utilisateurs:", error);
                alert("Impossible de charger les utilisateurs");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filtrer les utilisateurs en fonction du terme de recherche
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredUsers(users);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = users.filter(
            (user) =>
                user.firstname.toLowerCase().includes(term) ||
                user.lastname.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                user.city.toLowerCase().includes(term) ||
                user.phone.includes(term) ||
                (user.siret && user.siret.includes(term))
        );

        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    // Gérer la création ou la mise à jour d'un utilisateur
    const handleSubmit = async (values: z.infer<typeof userFormSchema>) => {
        try {
            setIsSubmitting(true);

            // Si on modifie un utilisateur existant
            if (editingUser) {
                // Simulation de mise à jour (à remplacer par l'appel API)
                // await fetch(`/api/admin/users/${editingUser.id}`, { method: "PUT", body: JSON.stringify(values) })

                // Mise à jour locale
                const updatedUsers = users.map(user =>
                    user.id === editingUser.id ? {
                        ...user,
                        ...values,
                        role: roles.find(r => r.id === values.roleId) || user.role
                    } : user
                );

                setUsers(updatedUsers);
                alert(`Les informations de ${values.firstname} ${values.lastname} ont été mises à jour.`);
            } else {
                // Simulation de création (à remplacer par l'appel API)
                // const response = await fetch("/api/admin/users", { method: "POST", body: JSON.stringify(values) })

                // Création locale avec ID fictif
                const newUser: User = {
                    id: `new-${Date.now()}`,
                    ...values,
                    role: roles.find(r => r.id === values.roleId)!,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                setUsers([...users, newUser]);
                alert(`Le compte de ${values.firstname} ${values.lastname} a été créé avec succès.`);
            }

            // Réinitialiser le formulaire et fermer le dialogue
            form.reset();
            setIsDialogOpen(false);
            setEditingUser(null);
            setIsCreating(false);
        } catch (error) {
            console.error("Erreur lors de l'enregistrement de l'utilisateur:", error);
            alert("Une erreur est survenue lors de l'enregistrement des données.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Gérer la suppression d'un utilisateur
    const handleDelete = async (id: string) => {
        try {
            // Simulation de suppression (à remplacer par l'appel API)
            // await fetch(`/api/admin/users/${id}`, { method: "DELETE" })

            // Suppression locale
            setUsers(users.filter(user => user.id !== id));
            setDeleteConfirmId(null);

            alert("L'utilisateur a été supprimé avec succès.");
        } catch (error) {
            console.error("Erreur lors de la suppression de l'utilisateur:", error);
            alert("Impossible de supprimer l'utilisateur.");
        }
    };

    // Ouvrir le formulaire pour édition
    const openEditForm = (user: User) => {
        setEditingUser(user);
        form.reset({
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            address: user.address,
            city: user.city,
            zipCode: user.zipCode,
            phone: user.phone,
            roleId: user.roleId,
            isProfessional: !!user.siret,
            siret: user.siret || "",
        });
        setIsDialogOpen(true);
    };

    // Ouvrir le formulaire pour création
    const openCreateForm = () => {
        setEditingUser(null);
        form.reset({
            firstname: "",
            lastname: "",
            email: "",
            password: "",
            address: "",
            city: "",
            zipCode: "",
            phone: "",
            roleId: "",
            isProfessional: false,
            siret: "",
        });
        setIsCreating(true);
        setIsDialogOpen(true);
    };

    // Créer manuellement un tableau d'utilisateurs
    const renderUserTable = () => {
        return (
            <div className="border rounded-md overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rôle</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ville</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Téléphone</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="border-t">
                                <td className="px-4 py-3 font-medium">
                                    {user.firstname} {user.lastname}
                                </td>
                                <td className="px-4 py-3">{user.email}</td>
                                <td className="px-4 py-3">
                                    <Badge variant={
                                        user.role.name === "ADMIN" ? "default" :
                                            user.role.name === "MANAGER" ? "secondary" : "outline"
                                    }>
                                        {user.role.name}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3">{user.city}</td>
                                <td className="px-4 py-3">{user.phone}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end items-center space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditForm(user)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => setDeleteConfirmId(user.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>

                                        {/* Confirmation de suppression */}
                                        {deleteConfirmId === user.id && (
                                            <div className="absolute bg-background border rounded-md p-2 shadow-md flex items-center gap-2">
                                                <span className="text-sm">Confirmer ?</span>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => handleDelete(user.id)}
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

    return (
        <div className="space-y-4">
            {/* Barre d'outils et recherche */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Rechercher un utilisateur..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={openCreateForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvel utilisateur
                </Button>
            </div>

            {/* Table des utilisateurs */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <p className="text-muted-foreground mb-2">Aucun utilisateur trouvé</p>
                    <Button variant="outline" onClick={openCreateForm}>
                        <Plus className="mr-2 h-4 w-4" />
                        Créer un utilisateur
                    </Button>
                </div>
            ) : (
                renderUserTable()
            )}

            {/* Modal de création/édition */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? "Modifier un utilisateur" : "Créer un utilisateur"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? "Modifiez les informations de l'utilisateur ci-dessous."
                                : "Remplissez les informations pour créer un nouvel utilisateur."}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstname"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Prénom</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Prénom" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="lastname"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nom" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="email@exemple.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {!editingUser && (
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mot de passe</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="******" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {editingUser && (
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mot de passe (optionnel)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Laisser vide pour ne pas modifier"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Laisser vide pour conserver le mot de passe actuel
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adresse</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123 rue Exemple" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ville</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ville" {...field} />
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
                                                <Input placeholder="75000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Téléphone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="06 12 34 56 78" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="roleId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rôle</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner un rôle" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role.id} value={role.id}>
                                                            {role.name}
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
                                    name="isProfessional"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-8">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Compte professionnel</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {isProfessional && (
                                <FormField
                                    control={form.control}
                                    name="siret"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Numéro SIRET</FormLabel>
                                            <FormControl>
                                                <Input placeholder="12345678901234" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Le numéro SIRET doit contenir 14 chiffres
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

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
                                    {editingUser ? "Mettre à jour" : "Créer"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}