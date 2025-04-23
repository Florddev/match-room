"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

export default function Navbar() {
    const { user, logout, isLoading } = useAuth()

    return (
        <header className="bg-background border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold">
                    Superblog
                </Link>
                <nav>
                    <ul className="flex items-center space-x-4">
                        <li>
                            <Link href="/" className="hover:text-primary">
                                Accueil
                            </Link>
                        </li>
                        <li>
                            <Link href="/posts" className="hover:text-primary">
                                Articles
                            </Link>
                        </li>
                        {!isLoading && (
                            <>
                                {user ? (
                                    <>
                                        <li>
                                            <Link href="/posts/create" className="hover:text-primary">
                                                Nouvel article
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/profile" className="hover:text-primary">
                                                Profil
                                            </Link>
                                        </li>
                                        <li>
                                            <Button variant="ghost" onClick={logout}>
                                                Déconnexion
                                            </Button>
                                        </li>
                                    </>
                                ) : (
                                    <>
                                        <li>
                                            <Link href="/auth/login">
                                                <Button variant="outline">Connexion</Button>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/auth/register">
                                                <Button>Inscription</Button>
                                            </Link>
                                        </li>
                                    </>
                                )}
                            </>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    )
}