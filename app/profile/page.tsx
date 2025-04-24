"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <>
                <div className="flex min-h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </>
        )
    }

    if (!user) {
        return (
            <>
                <div className="flex min-h-screen items-center justify-center">
                    <Card>
                        <CardHeader>
                            <CardTitle>Accès non autorisé</CardTitle>
                            <CardDescription>Vous devez être connecté pour accéder à cette page</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Link href="/auth/login">
                                <Button>Se connecter</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            </>
        )
    }

    return (
        <>
            <div className="container mx-auto py-8">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Profil Utilisateur</CardTitle>
                        <CardDescription>Vos informations personnelles</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Nom complet</p>
                            <p className="text-base">{user.firstname} {user.lastname}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p className="text-base">{user.email}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                            <p className="text-base">{user.phone}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                            <p className="text-base">{user.address}, {user.zipCode} {user.city}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Rôle</p>
                            <p className="text-base">{user.role.name}</p>
                        </div>
                        {user.siret && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">SIRET</p>
                                <p className="text-base">{user.siret}</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">
                            Modifier le profil
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </>
    )
}