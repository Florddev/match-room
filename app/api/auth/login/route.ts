import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { nanoid } from "nanoid"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "votre-clé-secrète-super-sécurisée"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json(
                { message: "Email et mot de passe requis" },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            return NextResponse.json(
                { message: "Email ou mot de passe incorrect" },
                { status: 401 }
            )
        }

        const passwordMatch = await bcrypt.compare(password, user.password)

        if (!passwordMatch) {
            return NextResponse.json(
                { message: "Email ou mot de passe incorrect" },
                { status: 401 }
            )
        }

        const token = await new SignJWT({
            id: user.id,
            email: user.email,
            name: user.name,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setJti(nanoid())
            .setIssuedAt()
            .setExpirationTime("24h")
            .sign(new TextEncoder().encode(JWT_SECRET_KEY))

        const cookieStore = await cookies()
        cookieStore.set({
            name: "auth-token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24,
            path: "/",
        })

        const { password: _, ...userWithoutPassword } = user

        return NextResponse.json({
            message: "Connexion réussie",
            user: userWithoutPassword,
        })
    } catch (error) {
        console.error("Erreur lors de la connexion:", error)
        return NextResponse.json(
            { message: "Une erreur s'est produite lors de la connexion" },
            { status: 500 }
        )
    }
}