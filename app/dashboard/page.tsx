"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/overview"
import { RecentBookings } from "@/components/recent-bookings"
import { Hotel, Building2, BedDouble, Users, TrendingUp, Calendar } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

interface DashboardStats {
  totalHotels: number
  totalRooms: number
  averagePrice: number
  averageRating: number
  recentBookings: any[]
  topHotels: {
    id: string
    name: string
    roomCount: number
    averagePrice: number
    rating: number
  }[]
  monthlyStats: {
    month: string
    bookings: number
    revenue: number
  }[]
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user) return

      try {
        const response = await fetch("/api/dashboard")

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des statistiques du tableau de bord")
        }

        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error("Erreur:", err)
        setError("Impossible de charger les statistiques du tableau de bord")
      } finally {
        setDataLoading(false)
      }
    }

    if (!isLoading && user) {
      fetchDashboardStats()
    } else if (!isLoading && !user) {
      setDataLoading(false)
    }
  }, [user, isLoading])

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!isLoading && !user) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès restreint</CardTitle>
            <CardDescription>Veuillez vous connecter pour accéder au tableau de bord</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/auth/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Afficher un indicateur de chargement pendant que les données sont récupérées
  if (isLoading || dataLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <Skeleton className="h-4 w-[100px]" />
                  </CardTitle>
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[60px]" />
                  <Skeleton className="mt-2 h-4 w-[120px]" />
                </CardContent>
              </Card>
            ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Vue d'ensemble</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Réservations récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Afficher un message d'erreur si la récupération des données a échoué
  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
            >
              Réessayer
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hôtels</CardTitle>
            <Hotel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalHotels || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.totalHotels === 1 ? "Hôtel géré" : "Hôtels gérés"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chambres</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRooms || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalRooms === 1 ? "Chambre disponible" : "Chambres disponibles"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prix moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.averagePrice?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Par nuit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageRating?.toFixed(1) || "0.0"}/5</div>
            <p className="text-xs text-muted-foreground">Basée sur les évaluations</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="bookings">Réservations</TabsTrigger>
          <TabsTrigger value="hotels">Hôtels</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Performance mensuelle</CardTitle>
                <CardDescription>Nombre de réservations et revenus par mois</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview data={stats?.monthlyStats || []} />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Réservations récentes</CardTitle>
                <CardDescription>Les dernières réservations effectuées</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentBookings bookings={stats?.recentBookings || []} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendrier des réservations</CardTitle>
              <CardDescription>Vue d'ensemble des réservations à venir</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="flex h-[400px] items-center justify-center">
                <div className="flex flex-col items-center text-center">
                  <Calendar className="mb-2 h-16 w-16 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Calendrier des réservations</h3>
                  <p className="text-sm text-muted-foreground">Cette fonctionnalité sera bientôt disponible</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hotels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performances des hôtels</CardTitle>
              <CardDescription>Comparaison des performances de vos hôtels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {stats?.topHotels?.map((hotel) => (
                  <div key={hotel.id} className="flex items-center">
                    <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        <Link href={`/dashboard/hotels/${hotel.id}`} className="hover:underline">
                          {hotel.name}
                        </Link>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {hotel.roomCount} {hotel.roomCount === 1 ? "chambre" : "chambres"} • $
                        {hotel.averagePrice.toFixed(2)} prix moyen •{hotel.rating.toFixed(1)}/5 note
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      <Link href={`/dashboard/hotels/${hotel.id}`} className="text-sm text-primary hover:underline">
                        Voir détails
                      </Link>
                    </div>
                  </div>
                ))}

                {(!stats?.topHotels || stats.topHotels.length === 0) && (
                  <div className="flex h-[200px] items-center justify-center">
                    <div className="flex flex-col items-center text-center">
                      <Building2 className="mb-2 h-16 w-16 text-muted-foreground" />
                      <h3 className="text-lg font-medium">Aucun hôtel trouvé</h3>
                      <p className="text-sm text-muted-foreground">Vous n'avez pas encore ajouté d'hôtel</p>
                      <Link href="/dashboard/hotels/new" className="mt-4 rounded-md bg-primary px-4 py-2 text-white">
                        Ajouter un hôtel
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
