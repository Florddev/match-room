import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { SignJWT } from "jose"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true, // Inclure le rôle de l'utilisateur
      },
    })

    if (!user) {
      return Response.json({ error: "Email ou mot de passe incorrect" }, { status: 401 })
    }

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return Response.json({ error: "Email ou mot de passe incorrect" }, { status: 401 })
    }

    // Créer un token JWT avec le rôle inclus dans le payload
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "votre-clé-secrète-super-sécurisée"
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      role: { name: user.role.name }, // Inclure le rôle dans le token
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode(JWT_SECRET_KEY))

    // Définir le cookie
    const cookiesInstance = await cookies()
    cookiesInstance.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 heures
    })

    // Retourner les informations de l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user
    return Response.json({ user: userWithoutPassword })
  } catch (error) {
    console.error("Erreur de connexion:", error)
    return Response.json({ error: "Une erreur est survenue lors de la connexion" }, { status: 500 })
  }
}
