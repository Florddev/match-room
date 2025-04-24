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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import type { Room } from "@/models"

const roomFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  price: z.coerce.number().min(0, {
    message: "Price must be a positive number.",
  }),
  rate: z.coerce.number().min(0).max(5, {
    message: "Rate must be between 0 and 5.",
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }),
  categories: z.string(),
  tags: z.string(),
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
    },
  })

  async function onSubmit(data: RoomFormValues) {
    setIsLoading(true)

    try {
      const response = await fetch(room ? `/api/dashboard/hotels/${hotelId}/rooms/${room.id}` : `/api/dashboard/hotels/${hotelId}/rooms`, {
        method: room ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          hotelId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save room")
      }

      toast(room ? "Room updated" : "Room created", {
        description: room ? "Your room has been updated successfully." : "Your room has been created successfully.",
      })

      router.push(`/dashboard/hotels/${hotelId}`)
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
            <CardTitle>{room ? "Edit Room" : "Add Room"}</CardTitle>
            <CardDescription>
              {room ? "Update the details of your room." : "Add a new room to your hotel."}
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
                    <Input placeholder="Deluxe Room" {...field} />
                  </FormControl>
                  <FormDescription>The name of your room.</FormDescription>
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
                    <FormLabel>Price per night</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>The price per night in USD.</FormDescription>
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
                    <FormDescription>The rating of the room (0-5).</FormDescription>
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A luxurious room with a beautiful view..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Detailed description of the room.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categories</FormLabel>
                  <FormControl>
                    <Input placeholder="Deluxe, Ocean View, Family" {...field} />
                  </FormControl>
                  <FormDescription>Comma-separated list of categories.</FormDescription>
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
                    <Input placeholder="#luxury #oceanview #family" {...field} />
                  </FormControl>
                  <FormDescription>Tags for the room.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : room ? "Update Room" : "Create Room"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
