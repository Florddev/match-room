"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import {
  BadgeCheck,
  Building2,
  Calendar,
  CreditCard,
  Edit,
  Heart,
  History,
  Home,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Shield,
  Star,
  UserIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ProfilePage() {
  const { user, isLoading, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement de votre profil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès non autorisé</CardTitle>
            <CardDescription>Vous devez être connecté pour accéder à cette page</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/auth/login" className="w-full">
              <Button className="w-full">Se connecter</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte de profil principale */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-semibold">
                  {user.firstname.charAt(0)}
                  {user.lastname.charAt(0)}
                </div>
                {user.role.name === "ADMIN" && (
                  <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </div>
                )}
              </div>
            </div>
            <CardTitle className="text-xl">
              {user.firstname} {user.lastname}
            </CardTitle>
            <CardDescription className="flex items-center justify-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </CardDescription>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                <BadgeCheck className="h-3 w-3" />
                {user.role.name}
              </span>
              {user.siret && (
                <span className="inline-flex items-center gap-1 text-xs bg-secondary/10 text-secondary-foreground px-2 py-1 rounded-full">
                  <Building2 className="h-3 w-3" />
                  Pro
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>
                  {user.address}, {user.zipCode} {user.city}
                </span>
              </div>
              {user.siret && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>SIRET: {user.siret}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Actions rapides</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-2 justify-start">
                  <Edit className="h-3 w-3" />
                  Modifier
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2 justify-start">
                  <Lock className="h-3 w-3" />
                  Sécurité
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2 justify-start">
                  <Heart className="h-3 w-3" />
                  Favoris
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 justify-start text-destructive hover:text-destructive"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
                  Déconnexion
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenu principal */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Aperçu</span>
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Réservations</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Favoris</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Paiements</span>
              </TabsTrigger>
            </TabsList>

            {/* Onglet Aperçu */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Activité récente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.createdAt ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Membre depuis</span>
                          <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Dernière connexion</span>
                          <span>Aujourd'hui</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Réservations</span>
                          <span>0</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucune activité récente</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Statistiques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Réservations totales</span>
                        <span>0</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Chambres favorites</span>
                        <span>0</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Avis publiés</span>
                        <span>0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Informations détaillées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Informations personnelles</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Prénom</span>
                          <span>{user.firstname}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Nom</span>
                          <span>{user.lastname}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Email</span>
                          <span>{user.email}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Téléphone</span>
                          <span>{user.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Adresse</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Rue</span>
                          <span>{user.address}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Ville</span>
                          <span>{user.city}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Code postal</span>
                          <span>{user.zipCode}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Pays</span>
                          <span>France</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {user.siret && (
                    <div className="mt-4 pt-4 border-t">
                      <h3 className="text-sm font-medium mb-2">Informations professionnelles</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">SIRET</span>
                          <span>{user.siret}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Type de compte</span>
                          <span>Professionnel</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Réservations */}
            <TabsContent value="reservations">
              <Card>
                <CardHeader>
                  <CardTitle>Vos réservations</CardTitle>
                  <CardDescription>Historique de toutes vos réservations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Aucune réservation</h3>
                    <p className="text-sm text-muted-foreground max-w-md mt-1">
                      Vous n'avez pas encore effectué de réservation. Explorez nos chambres disponibles pour commencer.
                    </p>
                    <Button className="mt-4">
                      <Link href="/rooms">Découvrir les chambres</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Favoris */}
            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle>Vos favoris</CardTitle>
                  <CardDescription>Chambres et hôtels que vous avez ajoutés à vos favoris</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Aucun favori</h3>
                    <p className="text-sm text-muted-foreground max-w-md mt-1">
                      Vous n'avez pas encore ajouté de chambres ou d'hôtels à vos favoris. Explorez nos offres pour en
                      ajouter.
                    </p>
                    <Button className="mt-4">
                      <Link href="/rooms">Découvrir les chambres</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Paiements */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Méthodes de paiement</CardTitle>
                  <CardDescription>Gérez vos méthodes de paiement et vos factures</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Aucune méthode de paiement</h3>
                    <p className="text-sm text-muted-foreground max-w-md mt-1">
                      Vous n'avez pas encore ajouté de méthode de paiement. Ajoutez-en une pour faciliter vos futures
                      réservations.
                    </p>
                    <Button className="mt-4">Ajouter une méthode de paiement</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
