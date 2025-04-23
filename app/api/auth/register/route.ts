import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, email, password } = body

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Tous les champs sont requis" },
                { status: 400 }
            )
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { message: "Cet email est déjà utilisé" },
                { status: 400 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        })

        const { password: _, ...userWithoutPassword } = user

        return NextResponse.json(
            { message: "Utilisateur créé avec succès", user: userWithoutPassword },
            { status: 201 }
        )
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error)
        return NextResponse.json(
            { message: "Une erreur s'est produite lors de l'inscription" },
            { status: 500 }
        )
    }
}