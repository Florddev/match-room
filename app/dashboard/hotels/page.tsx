"use client"

import type React from "react"

import Link from "next/link"
import { Plus, Search, SlidersHorizontal } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { HotelsList } from "@/components/hotels-list"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Hotel } from "@/models"

export default function HotelsPage() {
  const { user, isLoading } = useAuth()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    // Fonction pour récupérer les hôtels via l'API
    const fetchHotels = async () => {
      if (!user) return

      try {
        const response = await fetch("/api/dashboard/hotels")

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des hôtels")
        }

        const data = await response.json()
        setHotels(data.hotels)
        setFilteredHotels(data.hotels)
      } catch (err) {
        console.error("Erreur:", err)
        setError("Impossible de charger la liste des hôtels")
      } finally {
        setDataLoading(false)
      }
    }

    if (!isLoading && user) {
      fetchHotels()
    } else if (!isLoading && !user) {
      setDataLoading(false)
    }
  }, [user, isLoading])

  // Filtrer et trier les hôtels lorsque les critères changent
  useEffect(() => {
    if (hotels.length === 0) return

    let result = [...hotels]

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (hotel) =>
          hotel.name.toLowerCase().includes(query) ||
          hotel.city.toLowerCase().includes(query) ||
          hotel.address.toLowerCase().includes(query),
      )
    }

    // Trier les résultats
    result.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "city":
          comparison = a.city.localeCompare(b.city)
          break
        case "rooms":
          comparison = (a.rooms?.length || 0) - (b.rooms?.length || 0)
          break
        case "rating":
          comparison = a.rate - b.rate
          break
        default:
          comparison = 0
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredHotels(result)
  }, [hotels, searchQuery, sortBy, sortOrder])

  // Gérer le changement de recherche
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Gérer le changement de tri
  const handleSortChange = (value: string) => {
    setSortBy(value)
  }

  // Gérer le changement d'ordre de tri
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!isLoading && !user) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès restreint</CardTitle>
            <CardDescription>Veuillez vous connecter pour accéder à la liste des hôtels</CardDescription>
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Vos Hôtels</h2>
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full sm:w-[300px]" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[120px]" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-[200px] w-full rounded-lg" />
            ))}
        </div>
      </div>
    )
  }

  // Afficher un message d'erreur si la récupération des données a échoué
  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Vos Hôtels</h2>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Vos Hôtels</h2>
        <Link href="/dashboard/hotels/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un Hôtel
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un hôtel..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="city">Ville</SelectItem>
              <SelectItem value="rooms">Nombre de chambres</SelectItem>
              <SelectItem value="rating">Note</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={toggleSortOrder}>
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredHotels.length > 0 ? (
        <HotelsList hotels={filteredHotels} />
      ) : (
        <Card className="p-8 text-center">
          <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
            <h3 className="text-lg font-semibold">Aucun hôtel trouvé</h3>
            {searchQuery ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Aucun hôtel ne correspond à votre recherche "{searchQuery}".
                </p>
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Effacer la recherche
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Vous n'avez pas encore ajouté d'hôtel. Commencez par en créer un.
                </p>
                <Link href="/dashboard/hotels/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un Hôtel
                  </Button>
                </Link>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
