// middleware.ts
import { jwtVerify } from "jose"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Routes qui nécessitent une authentification
const protectedRoutes = ["/profile", "/bookings", "/rooms/create"]

// Routes qui nécessitent un rôle spécifique
const adminRoutes = ["/admin"]
const managerRoutes = ["/manager", "/rooms/create"]

// Routes d'authentification
const authRoutes = ["/auth/login", "/auth/register"]

export async function middleware(request: NextRequest) {
    const token = request.cookies.get("auth-token")?.value
    const { pathname } = request.nextUrl

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
    const isManagerRoute = managerRoutes.some(route => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some(route => pathname === route)

    try {
        // Si l'utilisateur est sur une route protégée et n'est pas authentifié
        if ((isProtectedRoute || isAdminRoute || isManagerRoute) && !token) {
            const url = new URL("/auth/login", request.url)
            url.searchParams.set("callbackUrl", encodeURI(pathname))
            return NextResponse.redirect(url)
        }

        // Si l'utilisateur est déjà authentifié et essaie d'accéder aux pages d'authentification
        if (isAuthRoute && token) {
            const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "votre-clé-secrète-super-sécurisée"
            await jwtVerify(token, new TextEncoder().encode(JWT_SECRET_KEY))

            // Rediriger vers la page d'accueil si le token est valide
            return NextResponse.redirect(new URL("/", request.url))
        }

        // Si l'utilisateur est authentifié et essaie d'accéder à une route protégée
        if ((isProtectedRoute || isAdminRoute || isManagerRoute) && token) {
            const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "votre-clé-secrète-super-sécurisée"
            const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET_KEY))

            // Vérifier le rôle pour les routes admin
            if (isAdminRoute && payload.role !== "ADMIN") {
                return NextResponse.redirect(new URL("/access-denied", request.url))
            }

            // Vérifier le rôle pour les routes manager
            if (isManagerRoute && payload.role !== "MANAGER" && payload.role !== "ADMIN") {
                return NextResponse.redirect(new URL("/access-denied", request.url))
            }
        }
    } catch (error) {
        // Si le token n'est pas valide et que l'utilisateur est sur une route protégée
        if (isProtectedRoute || isAdminRoute || isManagerRoute) {
            const url = new URL("/auth/login", request.url)
            url.searchParams.set("callbackUrl", encodeURI(pathname))
            return NextResponse.redirect(url)
        }
    }

    return NextResponse.next()
}

// Définir sur quelles routes le middleware doit s'exécuter
export const config = {
    matcher: [
        /*
         * Correspond à toutes les routes de demande sauf pour les routes qui
         * commencent par:
         * - api (routes API)
         * - _next/static (fichiers statiques)
         * - _next/image (optimisation d'image)
         * - favicon.ico (favicon)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
}