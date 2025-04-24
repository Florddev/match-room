export type Hotel = {
    id: string
    name: string
    rate: number
    address: string
    city: string
    zipCode: string
    phone: string
    createdAt: string
    updatedAt: string
    rooms: Room[]
}

export type Room = {
    id: string
    name: string
    price: number
    rate: number
    maxOccupancy: number
    hotelId: string
    categories: string
    tags: string
    content: string
    createdAt: string
    updatedAt: string
    types: RoomTypeRelation[]
}

export type RoomType = {
    id: string
    name: string
}

export type RoomTypeRelation = {
    id: string
    roomId: string
    typeId: string
    type: RoomType
}

export type Negotiation = {
    id: string
    userId: string
    roomId: string
    status: string
    price: number
    createdAt: Date
    updatedAt: Date
}
