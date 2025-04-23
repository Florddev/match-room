// app/api/auth/me/route.ts
import prisma from "@/lib/prisma"
import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get("auth-token")?.value

        if (!token) {
            return NextResponse.json(
                { message: "Non autorisé" },
                { status: 401 }
            )
        }

        const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "votre-clé-secrète-super-sécurisée"
        const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET_KEY))

        // ID est maintenant une string selon le nouveau modèle
        const userId = payload.id as string

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                role: true
            }
        })

        if (!user) {
            return NextResponse.json(
                { message: "Utilisateur non trouvé" },
                { status: 404 }
            )
        }

        // Ne pas retourner le mot de passe
        const { password, ...userWithoutPassword } = user

        return NextResponse.json({ user: userWithoutPassword })
    } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error)
        return NextResponse.json(
            { message: "Non autorisé" },
            { status: 401 }
        )
    }
}