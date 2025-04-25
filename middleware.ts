import { jwtVerify } from "jose"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Routes protégées par authentification simple
const protectedRoutes = ["/profile", "/posts/create"]

// Routes d'authentification
const authRoutes = ["/auth/login", "/auth/register"]

export async function middleware(request: NextRequest) {
    const token = request.cookies.get("auth-token")?.value
    const { pathname } = request.nextUrl

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some(route => pathname === route)

    // Vérifier si la route nécessite un rôle spécifique
    const requiresAdminRole = pathname.startsWith("/dashboard/admin")
    const requiresHotelManagerRole = pathname.startsWith("/dashboard/hotels")
    
    // Route qui nécessite une vérification de rôle
    const isRoleRestrictedRoute = requiresAdminRole || requiresHotelManagerRole

    try {
        // Routes protégées sans token -> redirection vers login
        if ((isProtectedRoute || isRoleRestrictedRoute) && !token) {
            const url = new URL("/auth/login", request.url)
            url.searchParams.set("callbackUrl", encodeURI(pathname))
            return NextResponse.redirect(url)
        }

        // Routes d'auth avec token valide -> redirection vers home
        if (isAuthRoute && token) {
            const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "votre-clé-secrète-super-sécurisée"
            await jwtVerify(token, new TextEncoder().encode(JWT_SECRET_KEY))
            return NextResponse.redirect(new URL("/", request.url))
        }
        
        // Vérification de rôle pour les routes protégées ou à accès restreint
        if ((isProtectedRoute || isRoleRestrictedRoute) && token) {
            const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "votre-clé-secrète-super-sécurisée"
            const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET_KEY))

            const userRole = payload.role as string

            if (requiresAdminRole && userRole !== "ADMIN") {
                return NextResponse.redirect(new URL("/unauthorized", request.url))
            }
            
            if (requiresHotelManagerRole && !["ADMIN", "HOTEL_MANAGER"].includes(userRole)) {
                return NextResponse.redirect(new URL("/unauthorized", request.url))
            }
        }
    } catch (error) {
        if (isProtectedRoute || isRoleRestrictedRoute) {
            const url = new URL("/auth/login", request.url)
            url.searchParams.set("callbackUrl", encodeURI(pathname))
            return NextResponse.redirect(url)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
}