import Link from "next/link"
import { Building, Hotel, MapPin, Phone, Star, Plus } from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface HotelsListProps {
  hotels: any[]
}

export function HotelsList({ hotels }: HotelsListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {hotels.map((hotel) => (
        <Card key={hotel.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{hotel.name}</CardTitle>
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="ml-1 text-sm font-medium">{hotel.rate.toFixed(1)}</span>
              </div>
            </div>
            <CardDescription className="flex items-center text-sm">
              <MapPin className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
              {hotel.address}, {hotel.city}, {hotel.zipCode}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Phone className="mr-1 h-3.5 w-3.5" />
                {hotel.phone}
              </div>
              <div className="flex items-center">
                <Hotel className="mr-1 h-3.5 w-3.5" />
                {hotel.rooms.length} Rooms
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-3">
            <Link href={`/dashboard/hotels/${hotel.id}`}>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
            <Link href={`/dashboard/hotels/${hotel.id}/rooms`}>
              <Button size="sm">Manage Rooms</Button>
            </Link>
          </CardFooter>
        </Card>
      ))}

      {hotels.length === 0 && (
        <Card className="col-span-full p-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Building className="h-8 w-8 text-muted-foreground" />
            <h3 className="text-lg font-medium">No hotels found</h3>
            <p className="text-sm text-muted-foreground">
              You don't have any hotels yet. Add your first hotel to get started.
            </p>
            <Link href="/dashboard/hotels/new">
              <Button className="mt-2">
                <Plus className="mr-2 h-4 w-4" />
                Add Hotel
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
