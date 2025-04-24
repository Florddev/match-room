"use client"

import Search from "@/components/search"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useSearch } from "@/lib/search-context"
import Link from "next/link"

export default function Navbar() {
    const { user, logout, isLoading } = useAuth()
    const { searchTerm, setSearchTerm } = useSearch()

    return (
        <header className="bg-background border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold">
                    MatchRoom
                </Link>

                {/* Utiliser le searchTerm et setSearchTerm du contexte */}
                <div className="hidden md:block w-1/3">
                    <Search
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        className="w-full"
                    />
                </div>

                <nav>
                    <ul className="flex items-center space-x-4">
                        <li>
                            <Link href="/" className="hover:text-primary">
                                Accueil
                            </Link>
                        </li>
                        {!isLoading && (
                            <>
                                {user ? (
                                    <>
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
            {/* Affichage du Search sur mobile, sous la navbar */}
            <div className="block md:hidden container mx-auto px-4 pb-3">
                <Search
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    className="w-full"
                />
            </div>
        </header>
    )
}