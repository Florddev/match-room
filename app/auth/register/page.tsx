"use client"

import { useAuth } from "@/lib/auth-context"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// Définir le schéma de validation avec isProfessional explicitement booléen
const formSchema = z.object({
    firstname: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères" }),
    lastname: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
    email: z.string().email({ message: "Adresse email invalide" }),
    password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
    confirmPassword: z.string().min(6, { message: "Veuillez confirmer votre mot de passe" }),
    address: z.string().min(5, { message: "L'adresse doit contenir au moins 5 caractères" }),
    city: z.string().min(2, { message: "La ville doit contenir au moins 2 caractères" }),
    zipCode: z.string().min(5, { message: "Le code postal doit contenir au moins 5 caractères" }),
    phone: z.string().min(10, { message: "Le numéro de téléphone doit contenir au moins 10 caractères" }),
    isProfessional: z.boolean(), // Assurez-vous que c'est un booléen sans valeur par défaut
    siret: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
}).refine(
    data => !data.isProfessional || (data.isProfessional && data.siret && data.siret.length >= 14),
    {
        message: "Le numéro SIRET est requis pour les comptes professionnels et doit contenir 14 chiffres",
        path: ["siret"],
    }
)

export default function RegisterPage() {
    const router = useRouter()
    const { register } = useAuth()
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstname: "",
            lastname: "",
            email: "",
            password: "",
            confirmPassword: "",
            address: "",
            city: "",
            zipCode: "",
            phone: "",
            isProfessional: false, // Assurez-vous d'avoir une valeur par défaut explicitement définie
            siret: "",
        },
    })

    const isProfessional = form.watch("isProfessional")

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setError(null)

        try {
            // Exclure certains champs avant l'envoi
            const { confirmPassword, isProfessional, ...registrationData } = values

            await register(registrationData)

            // Redirection après inscription réussie
            router.push("/auth/login")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur s'est produite")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Inscription</CardTitle>
                    <CardDescription className="text-center">
                        Créez votre compte Match Room
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstname"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Prénom</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Votre prénom" {...field} />
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
                                                <Input placeholder="Votre nom" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="votre@email.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mot de passe</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirmer le mot de passe</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adresse</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123 rue de Paris" {...field} />
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
                                                <Input placeholder="0612345678" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="isProfessional"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Je suis un professionnel</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />

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
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Inscription en cours..." : "S'inscrire"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex flex-col items-center justify-center space-y-2">
                    <div className="text-center text-sm">
                        Vous avez déjà un compte?{" "}
                        <Link href="/auth/login" className="text-primary underline hover:text-primary/80">
                            Se connecter
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}