import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { SignJWT } from "jose"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    if (existingUser) {
      return Response.json({ error: "Cet email est déjà utilisé" }, { status: 400 })
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Trouver le rôle "USER" par défaut
    const userRole = await prisma.role.findFirst({
      where: { name: "USER" },
    })

    if (!userRole) {
      return Response.json({ error: "Rôle utilisateur non trouvé" }, { status: 500 })
    }

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        roleId: userRole.id, // Assigner le rôle USER par défaut
      },
      include: {
        role: true, // Inclure le rôle dans la réponse
      },
    })

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
    console.error("Erreur d'inscription:", error)
    return Response.json({ error: "Une erreur est survenue lors de l'inscription" }, { status: 500 })
  }
}
