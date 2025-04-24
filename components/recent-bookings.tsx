import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function RecentBookings() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`/placeholder-user.jpg`} alt="Avatar" />
            <AvatarFallback>U{i}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">Guest {i + 1}</p>
            <p className="text-sm text-muted-foreground">Room {Math.floor(Math.random() * 100) + 100}</p>
          </div>
          <div className="ml-auto font-medium">+${Math.floor(Math.random() * 200) + 100}</div>
        </div>
      ))}
    </div>
  )
}
