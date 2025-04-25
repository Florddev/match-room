import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { SignJWT } from "jose"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()

    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    if (existingUser) {
      return Response.json({ error: "Cet email est déjà utilisé" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10)

    const roleName = userData.isProfessional && userData.siret ? "MANAGER" : "CLIENT"
    
    const userRole = await prisma.role.findFirst({
      where: { name: roleName },
    })

    if (!userRole) {
      return Response.json({ error: `Rôle ${roleName} non trouvé` }, { status: 500 })
    }

    const {
      firstname,
      lastname,
      email,
      address,
      city,
      zipCode,
      phone,
      siret,
      isProfessional,
      ...restUserData
    } = userData;

    const user = await prisma.user.create({
      data: {
        firstname,
        lastname,
        email,
        password: hashedPassword,
        address,
        city,
        zipCode,
        phone,
        siret: siret || null,
        roleId: userRole.id,
      },
      include: {
        role: true,
      },
    })

    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "votre-clé-secrète-super-sécurisée"
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      role: { name: user.role.name },
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode(JWT_SECRET_KEY))

    const cookiesInstance = cookies()
    cookiesInstance.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
    })

    const { password: _, ...userWithoutPassword } = user
    return Response.json({ user: userWithoutPassword })
  } catch (error) {
    console.error("Erreur d'inscription:", error)
    return Response.json({ error: "Une erreur est survenue lors de l'inscription" }, { status: 500 })
  }
}