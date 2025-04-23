// app/api/auth/logout/route.ts
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
    try {
        const cookieStore = await cookies()
        cookieStore.delete("auth-token")

        return NextResponse.json({ message: "Déconnexion réussie" })
    } catch (error) {
        console.error("Erreur lors de la déconnexion:", error)
        return NextResponse.json(
            { message: "Une erreur s'est produite lors de la déconnexion" },
            { status: 500 }
        )
    }
}