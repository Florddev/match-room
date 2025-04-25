"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Bed, DollarSign, Hash, Info, Star, Tag } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import type { Room } from "@/models"

const roomFormSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caractères.",
  }),
  price: z.coerce.number().min(0, {
    message: "Le prix doit être un nombre positif.",
  }),
  rate: z.coerce.number().min(0).max(5, {
    message: "La note doit être comprise entre 0 et 5.",
  }),
  content: z.string().min(10, {
    message: "La description doit contenir au moins 10 caractères.",
  }),
  categories: z.string(),
  tags: z.string(),
  capacity: z.coerce
    .number()
    .min(1, {
      message: "La capacité doit être d'au moins 1 personne.",
    })
    .optional(),
  roomType: z.string().optional(),
  amenities: z.string().optional(),
})

type RoomFormValues = z.infer<typeof roomFormSchema>

interface RoomFormProps {
  hotelId: string
  room?: Room
  types?: { id: string; name: string }[]
}

export function RoomForm({ hotelId, room, types = [] }: RoomFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: room?.name || "",
      price: room?.price || 0,
      rate: room?.rate || 0,
      content: room?.content || "",
      categories: room?.categories || "",
      tags: room?.tags || "",
      //capacity: room?.capacity || 2,
      //roomType: room?.roomType || "",
      //amenities: room?.amenities || "",
    },
  })

  async function onSubmit(data: RoomFormValues) {
    setIsLoading(true)

    try {
      const response = await fetch(
        room ? `/api/dashboard/hotels/${hotelId}/rooms/${room.id}` : `/api/dashboard/hotels/${hotelId}/rooms`,
        {
          method: room ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            hotelId,
          }),
        },
      )

      if (!response.ok) {
        throw new Error("Failed to save room")
      }

      toast(room ? "Chambre mise à jour" : "Chambre créée", {
        description: room ? "Votre chambre a été mise à jour avec succès." : "Votre chambre a été créée avec succès.",
      })

      router.push(`/dashboard/hotels/${hotelId}`)
      router.refresh()
    } catch (error) {
      toast("Erreur", {
        description: "Une erreur est survenue. Veuillez réessayer.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Informations générales</TabsTrigger>
            <TabsTrigger value="details">Détails supplémentaires</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bed className="h-5 w-5" />
                  {room ? "Modifier la chambre" : "Ajouter une chambre"}
                </CardTitle>
                <CardDescription>
                  {room
                    ? "Mettez à jour les informations de votre chambre."
                    : "Ajoutez une nouvelle chambre à votre hôtel."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Chambre Deluxe" {...field} />
                      </FormControl>
                      <FormDescription>Le nom de votre chambre.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Prix par nuit
                        </FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription>Le prix par nuit en euros.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          Note
                        </FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="5" step="0.1" {...field} />
                        </FormControl>
                        <FormDescription>La note de la chambre (0-5).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Une chambre luxueuse avec une vue magnifique..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Description détaillée de la chambre.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Catégories et caractéristiques
                </CardTitle>
                <CardDescription>Informations supplémentaires sur la chambre.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacité</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>Nombre de personnes.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roomType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de chambre</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {types.length > 0 ? (
                              types.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))
                            ) : (
                              <>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="deluxe">Deluxe</SelectItem>
                                <SelectItem value="suite">Suite</SelectItem>
                                <SelectItem value="family">Familiale</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>Type de chambre.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4" />

                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Hash className="h-4 w-4" />
                        Catégories
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Deluxe, Vue sur mer, Familiale" {...field} />
                      </FormControl>
                      <FormDescription>Liste de catégories séparées par des virgules.</FormDescription>
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
                        <Input placeholder="#luxe #vuemer #famille" {...field} />
                      </FormControl>
                      <FormDescription>Tags pour la chambre.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amenities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Équipements</FormLabel>
                      <FormControl>
                        <Input placeholder="WiFi, TV, Climatisation, Mini-bar" {...field} />
                      </FormControl>
                      <FormDescription>Liste des équipements séparés par des virgules.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-between border rounded-lg px-6 py-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Enregistrement..." : room ? "Mettre à jour" : "Créer la chambre"}
          </Button>
        </CardFooter>
      </form>
    </Form>
  )
}
