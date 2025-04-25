import prisma from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')

    if (!email) {
      return Response.json({ error: "Email requis" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return Response.json({ exists: true, message: "Cet email est déjà utilisé" })
    }

    return Response.json({ exists: false, message: "Email disponible" })
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email:", error)
    return Response.json(
      { error: "Une erreur est survenue lors de la vérification de l'email" },
      { status: 500 }
    )
  }
}