"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building, MapPin, Star } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import type { Hotel } from "@/models"

const hotelFormSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caractères.",
  }),
  description: z
    .string()
    .min(10, {
      message: "La description doit contenir au moins 10 caractères.",
    })
    .optional(),
  rate: z.coerce.number().min(0).max(5, {
    message: "La note doit être comprise entre 0 et 5.",
  }),
  address: z.string().min(5, {
    message: "L'adresse doit contenir au moins 5 caractères.",
  }),
  city: z.string().min(2, {
    message: "La ville doit contenir au moins 2 caractères.",
  }),
  zipCode: z.string().min(3, {
    message: "Le code postal doit contenir au moins 3 caractères.",
  }),
  phone: z.string().min(5, {
    message: "Le numéro de téléphone doit contenir au moins 5 caractères.",
  }),
  website: z
    .string()
    .url({
      message: "Veuillez entrer une URL valide.",
    })
    .optional()
    .or(z.literal("")),
  amenities: z.string().optional(),
})

type HotelFormValues = z.infer<typeof hotelFormSchema>

interface HotelFormProps {
  hotel?: Hotel
}

export function HotelForm({ hotel }: HotelFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<HotelFormValues>({
    resolver: zodResolver(hotelFormSchema),
    defaultValues: {
      name: hotel?.name || "",
      description: hotel?.name || "",
      rate: hotel?.rate || 0,
      address: hotel?.address || "",
      city: hotel?.city || "",
      zipCode: hotel?.zipCode || "",
      phone: hotel?.phone || "",
      //website: hotel?.website || "",
      //amenities: hotel?.amenities || "",
    },
  })

  async function onSubmit(data: HotelFormValues) {
    setIsLoading(true)

    try {
      const response = await fetch(hotel ? `/api/dashboard/hotels/${hotel.id}` : `/api/dashboard/hotels`, {
        method: hotel ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to save hotel")
      }

      toast(hotel ? "Hôtel mis à jour" : "Hôtel créé", {
        description: hotel ? "Votre hôtel a été mis à jour avec succès." : "Votre hôtel a été créé avec succès.",
      })

      router.push("/dashboard/hotels")
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
                  <Building className="h-5 w-5" />
                  {hotel ? "Modifier l'hôtel" : "Ajouter un hôtel"}
                </CardTitle>
                <CardDescription>
                  {hotel ? "Mettez à jour les informations de votre hôtel." : "Ajoutez un nouvel hôtel à votre compte."}
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
                        <Input placeholder="Grand Hôtel" {...field} />
                      </FormControl>
                      <FormDescription>Le nom de votre hôtel.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Un hôtel luxueux avec une vue magnifique..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Description détaillée de l'hôtel.</FormDescription>
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
                      <FormDescription>La note de l'hôtel (0-5).</FormDescription>
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
                  <MapPin className="h-5 w-5" />
                  Adresse et contact
                </CardTitle>
                <CardDescription>Informations de localisation et de contact de l'hôtel.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Rue Principale" {...field} />
                      </FormControl>
                      <FormDescription>L'adresse de votre hôtel.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input placeholder="+33 1 23 45 67 89" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site web</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.monhotel.com" {...field} />
                        </FormControl>
                        <FormDescription>Site web de l'hôtel (optionnel).</FormDescription>
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
                          <Input placeholder="WiFi, Piscine, Spa, Restaurant" {...field} />
                        </FormControl>
                        <FormDescription>Liste des équipements séparés par des virgules.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-between border rounded-lg px-6 py-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Enregistrement..." : hotel ? "Mettre à jour" : "Créer l'hôtel"}
          </Button>
        </CardFooter>
      </form>
    </Form>
  )
}
