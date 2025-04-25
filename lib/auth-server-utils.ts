import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import prisma from "@/lib/prisma"

export async function getServerAuthUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "votre-clé-secrète-super-sécurisée"
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET_KEY))

    const userId = payload.id as string

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    })

    if (!user) {
      return null
    }

    const { password, ...userWithoutPassword } = user

    return userWithoutPassword
  } catch (error) {
    console.error("Erreur d'authentification serveur:", error)
    return null
  }
}

export async function withServerAuth(handler: (user: any) => Promise<Response>) {
  const user = await getServerAuthUser()

  if (!user) {
    return Response.json({ error: "Non autorisé" }, { status: 401 })
  }

  return handler(user)
}

export async function withManagerAuth(handler: (user: any) => Promise<Response>) {
  const user = await getServerAuthUser()

  if (!user) {
    return Response.json({ error: "Non autorisé" }, { status: 401 })
  }

  if (user.role.name !== "MANAGER") {
    return Response.json({ error: "Accès réservé aux managers" }, { status: 403 })
  }

  return handler(user)
}

export async function getUserSession() {
  return getServerAuthUser()
}
