"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import type { Hotel } from "@/models"

const hotelFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  rate: z.coerce.number().min(0).max(5, {
    message: "Rate must be between 0 and 5.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }),
  zipCode: z.string().min(3, {
    message: "Zip code must be at least 3 characters.",
  }),
  phone: z.string().min(5, {
    message: "Phone must be at least 5 characters.",
  }),
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
      rate: hotel?.rate || 0,
      address: hotel?.address || "",
      city: hotel?.city || "",
      zipCode: hotel?.zipCode || "",
      phone: hotel?.phone || "",
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

      toast(hotel ? "Hotel updated" : "Hotel created", {
        description: hotel ? "Your hotel has been updated successfully." : "Your hotel has been created successfully.",
      })

      router.push("/dashboard/hotels")
      router.refresh()
    } catch (error) {
      toast("Error", {
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{hotel ? "Edit Hotel" : "Add Hotel"}</CardTitle>
            <CardDescription>
              {hotel ? "Update the details of your hotel." : "Add a new hotel to your account."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Grand Hotel" {...field} />
                  </FormControl>
                  <FormDescription>The name of your hotel.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="5" step="0.1" {...field} />
                  </FormControl>
                  <FormDescription>The rating of the hotel (0-5).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormDescription>The street address of your hotel.</FormDescription>
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
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
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
                    <FormLabel>Zip Code</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : hotel ? "Update Hotel" : "Create Hotel"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
