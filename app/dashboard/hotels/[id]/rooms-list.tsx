import Link from "next/link"
import { Edit, Star, Tag, Trash, Hotel, Plus } from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface RoomsListProps {
  rooms: any[]
  hotelId: string
}

export function RoomsList({ rooms, hotelId }: RoomsListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <Card key={room.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{room.name}</CardTitle>
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="ml-1 text-sm font-medium">{room.rate.toFixed(1)}</span>
              </div>
            </div>
            <CardDescription className="flex items-center text-sm">${room.price.toFixed(2)} per night</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{room.content}</p>
            <div className="flex flex-wrap gap-1">
              {room.categories.split(",").map((category: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {category.trim()}
                </Badge>
              ))}
            </div>
            {room.tags && (
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <Tag className="mr-1 h-3 w-3" />
                {room.tags}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-3">
            <Link href={`/dashboard/hotels/${hotelId}/rooms/${room.id}`}>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
            <div className="flex space-x-2">
              <Link href={`/dashboard/hotels/${hotelId}/rooms/${room.id}/edit`}>
                <Button size="sm" variant="ghost">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <form action={`/api/rooms/${room.id}/delete`}>
                <Button size="sm" variant="ghost" className="text-destructive">
                  <Trash className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardFooter>
        </Card>
      ))}

      {rooms.length === 0 && (
        <Card className="col-span-full p-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Hotel className="h-8 w-8 text-muted-foreground" />
            <h3 className="text-lg font-medium">No rooms found</h3>
            <p className="text-sm text-muted-foreground">
              This hotel doesn't have any rooms yet. Add your first room to get started.
            </p>
            <Link href={`/dashboard/hotels/${hotelId}/rooms/new`}>
              <Button className="mt-2">
                <Plus className="mr-2 h-4 w-4" />
                Add Room
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
