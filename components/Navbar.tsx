"use client"

import { useAuth } from "@/lib/auth-context"
import { useSearch } from "@/lib/search-context"
import {
  Building2,
  Calendar,
  ChevronDown,
  Globe,
  HelpCircle,
  Home,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  User,
  UserPlus
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useRef, useState } from "react"

export default function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const { searchTerm, setSearchTerm } = useSearch()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const router = useRouter()
  const pathname = usePathname() // Ajout pour détecter le chemin actuel

  const userMenuRef = useRef<HTMLDivElement>(null)
  const languageMenuRef = useRef<HTMLDivElement>(null)

  // Fermer les menus lors d'un clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/rooms?search=${searchTerm}`)
  }

  // Fonction pour déterminer si un lien est actif
  const isActive = (path: string) => {
    return pathname?.startsWith(path)
  }

  // Classes pour les liens
  const defaultLinkClasses = "px-3 py-2 rounded-md text-sm font-medium flex items-center"
  const activeLinkClasses = `${defaultLinkClasses} bg-blue-100 text-blue-800`
  const inactiveLinkClasses = `${defaultLinkClasses} hover:bg-gray-100`

  // Classes pour les liens mobiles
  const defaultMobileLinkClasses = "flex items-center px-4 py-2 text-sm"
  const activeMobileLinkClasses = `${defaultMobileLinkClasses} bg-blue-100 text-blue-800`
  const inactiveMobileLinkClasses = `${defaultMobileLinkClasses} hover:bg-gray-100`

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div>
              <img
                src="/logo.svg"
                alt="MatchRoom Logo"
                className="h-12 w-auto block object-contain"
              />
            </div>
          </Link>

          {/* Navigation principale - Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/rooms"
              className={isActive('/rooms') ? activeLinkClasses : inactiveLinkClasses}
            >
              <Home className="h-4 w-4 mr-1" />
              Chambres
            </Link>
            <Link
              href="/hotels"
              className={isActive('/hotels') ? activeLinkClasses : inactiveLinkClasses}
            >
              <Building2 className="h-4 w-4 mr-1" />
              Hôtels
            </Link>
          </nav>

          {/* Actions utilisateur - Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Sélecteur de langue */}
            <div className="relative" ref={languageMenuRef}>
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
              >
                <Globe className="h-4 w-4 mr-1" />
                <span>FR</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </button>

              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 font-medium">
                      Français
                    </button>
                    <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">English</button>
                    <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Español</button>
                    <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Deutsch</button>
                  </div>
                </div>
              )}
            </div>

            {/* Aide */}
            <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100">
              <HelpCircle className="h-4 w-4" />
            </Link>

            {/* Menu utilisateur */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 rounded-full border border-gray-300 p-1 pl-3 hover:shadow-md transition-shadow"
              >
                <Menu className="h-4 w-4" />
                <div className="bg-gray-200 rounded-full p-1">
                  <User className="h-4 w-4" />
                </div>
              </button>

              {showUserMenu && !isLoading && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  {user ? (
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium">{user.firstname || "Utilisateur"}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link href="/profile" className="flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                        <User className="h-4 w-4 mr-3 text-gray-500" />
                        Profil
                      </Link>

                      {user.role.name === 'CLIENT' &&
                        <>
                          <Link
                            href="/bookings"
                            className="flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            <Calendar className="h-4 w-4 mr-3 text-gray-500" />
                            Mes réservations
                          </Link>
                          <Link
                            href="/negotiations"
                            className="flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            <MessageSquare className="h-4 w-4 mr-3 text-gray-500" />
                            Mes négotiations
                          </Link>
                        </>
                      }

                      {user.role.name === 'MANAGER' &&
                        <Link href="/dashboard/hotels" className="flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                          <Settings className="h-4 w-4 mr-3 text-gray-500" />
                          Tableau de bord
                        </Link>
                      }

                      <div className="border-t border-gray-100 mt-1"></div>
                      <button
                        onClick={logout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Déconnexion
                      </button>
                    </div>
                  ) : (
                    <div className="py-1">
                      <Link href="/auth/login" className="flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                        <LogIn className="h-4 w-4 mr-3 text-gray-500" />
                        Connexion
                      </Link>
                      <Link href="/auth/register" className="flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                        <UserPlus className="h-4 w-4 mr-3 text-gray-500" />
                        Inscription
                      </Link>
                      <div className="border-t border-gray-100 mt-1"></div>
                      <Link href="/" className="flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                        <HelpCircle className="h-4 w-4 mr-3 text-gray-500" />
                        Centre d'aide
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Menu mobile */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 rounded-md hover:bg-gray-100">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Menu mobile déplié */}
        {showMobileMenu && (
          <div className="md:hidden mt-3 bg-white rounded-lg shadow-lg border border-gray-200">
            <nav className="py-2">
              <Link
                href="/rooms"
                className={isActive('/rooms') ? activeMobileLinkClasses : inactiveMobileLinkClasses}
                onClick={() => setShowMobileMenu(false)}
              >
                <Home className="h-4 w-4 mr-3 text-gray-500" />
                Chambres
              </Link>
              <Link
                href="/hotels"
                className={isActive('/hotels') ? activeMobileLinkClasses : inactiveMobileLinkClasses}
                onClick={() => setShowMobileMenu(false)}
              >
                <Building2 className="h-4 w-4 mr-3 text-gray-500" />
                Hôtels
              </Link>
              <Link
                href="/bookings"
                className={isActive('/bookings') ? activeMobileLinkClasses : inactiveMobileLinkClasses}
                onClick={() => setShowMobileMenu(false)}
              >
                <Calendar className="h-4 w-4 mr-3 text-gray-500" />
                Réservations
              </Link>

              <div className="border-t border-gray-100 my-1"></div>

              {!isLoading && (
                <>
                  {user ? (
                    <>
                      <Link
                        href="/profile"
                        className={isActive('/profile') ? activeMobileLinkClasses : inactiveMobileLinkClasses}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <User className="h-4 w-4 mr-3 text-gray-500" />
                        Profil
                      </Link>
                      <Link
                        href="/messages"
                        className={isActive('/messages') ? activeMobileLinkClasses : inactiveMobileLinkClasses}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <MessageSquare className="h-4 w-4 mr-3 text-gray-500" />
                        Messages
                      </Link>
                      <Link
                        href="/dashboard/hotels"
                        className={isActive('/dashboard') ? activeMobileLinkClasses : inactiveMobileLinkClasses}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <Settings className="h-4 w-4 mr-3 text-gray-500" />
                        Tableau de bord
                      </Link>
                      <button
                        onClick={() => {
                          logout()
                          setShowMobileMenu(false)
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Déconnexion
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        className={isActive('/auth/login') ? activeMobileLinkClasses : inactiveMobileLinkClasses}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <LogIn className="h-4 w-4 mr-3 text-gray-500" />
                        Connexion
                      </Link>
                      <Link
                        href="/auth/register"
                        className={isActive('/auth/register') ? activeMobileLinkClasses : inactiveMobileLinkClasses}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <UserPlus className="h-4 w-4 mr-3 text-gray-500" />
                        Inscription
                      </Link>
                    </>
                  )}
                </>
              )}

              <div className="border-t border-gray-100 my-1"></div>

              <div className="px-4 py-2">
                <p className="text-xs text-gray-500 mb-2">Langue</p>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1 text-xs rounded-md bg-blue-100 text-blue-800 font-medium">
                    Français
                  </button>
                  <button className="px-3 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200">English</button>
                  <button className="px-3 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200">Español</button>
                  <button className="px-3 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200">Deutsch</button>
                </div>
              </div>

              <Link
                href="/"
                className={isActive('/help') ? activeMobileLinkClasses : inactiveMobileLinkClasses}
                onClick={() => setShowMobileMenu(false)}
              >
                <HelpCircle className="h-4 w-4 mr-3 text-gray-500" />
                Centre d'aide
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}