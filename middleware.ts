import { jwtVerify } from "jose"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Routes qui nécessitent une authentification
const protectedRoutes = ["/profile", "/posts/create"]

// Routes d'authentification
const authRoutes = ["/auth/login", "/auth/register"]

export async function middleware(request: NextRequest) {
    const token = request.cookies.get("auth-token")?.value
    const { pathname } = request.nextUrl

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    const isAuthRoute = authRoutes.some(route => pathname === route)

    try {
        if (isProtectedRoute && !token) {
            const url = new URL("/auth/login", request.url)
            url.searchParams.set("callbackUrl", encodeURI(pathname))
            return NextResponse.redirect(url)
        }

        if (isAuthRoute && token) {
            const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "votre-clé-secrète-super-sécurisée"
            await jwtVerify(token, new TextEncoder().encode(JWT_SECRET_KEY))

            return NextResponse.redirect(new URL("/", request.url))
        }
        if (isProtectedRoute && token) {
            const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "votre-clé-secrète-super-sécurisée"
            await jwtVerify(token, new TextEncoder().encode(JWT_SECRET_KEY))
        }
    } catch (error) {
        if (isProtectedRoute) {
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
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
}