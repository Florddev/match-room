"use client"

import { useRouter } from "next/navigation"
import { createContext, ReactNode, useContext, useEffect, useState } from "react"
import { User } from "@/models";

type AuthContextType = {
    user: User | null
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (userData: RegistrationData) => Promise<void>
    logout: () => Promise<void>
    isAdmin: () => boolean
    isClient: () => boolean
    isManager: () => boolean
}

type RegistrationData = {
    firstname: string
    lastname: string
    email: string
    password: string
    address: string
    city: string
    zipCode: string
    phone: string
    siret?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const checkUser = async () => {
            try {
                const res = await fetch("/api/auth/me")
                if (res.ok) {
                    const data = await res.json()
                    setUser(data.user)
                }
            } catch (error) {
                console.error("Erreur lors de la vérification de l'utilisateur:", error)
            } finally {
                setIsLoading(false)
            }
        }

        checkUser()
    }, [])

    const login = async (email: string, password: string) => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.message || "Erreur lors de la connexion")
            }

            const data = await res.json()
            setUser(data.user)

            const searchParams = new URLSearchParams(window.location.search)
            const callbackUrl = searchParams.get('callbackUrl') || '/'

            router.push(callbackUrl)
            router.refresh()
        } catch (error) {
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const register = async (userData: RegistrationData) => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.message || "Erreur lors de l'inscription")
            }

            router.push("/auth/login")
        } catch (error) {
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const logout = async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/auth/logout", {
                method: "POST",
            })

            if (!res.ok) {
                throw new Error("Erreur lors de la déconnexion")
            }

            setUser(null)
            router.push("/auth/login")
            router.refresh()
        } catch (error) {
            console.error("Erreur lors de la déconnexion:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const isAdmin = () => {
        return user?.role?.name === "ADMIN"
    }

    const isClient = () => {
        return user?.role?.name === "CLIENT"
    }

    const isManager = () => {
        return user?.role?.name === "MANAGER"
    }

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            register,
            logout,
            isAdmin,
            isClient,
            isManager
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider")
    }
    return context
}