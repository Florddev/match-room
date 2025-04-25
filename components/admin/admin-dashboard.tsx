"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, CheckSquare, Hotel, Layers, MessageSquare, Users } from "lucide-react"
import { useState } from "react"
import { HotelsTab } from "./tabs/HotelsTab"
import { NegotiationsTab } from "./tabs/NegotiationsTab"
import { RoomsTab } from "./tabs/RoomsTab"
import { TypesTab } from "./tabs/TypesTab"
import { UsersTab } from "./tabs/UsersTab"

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("users")

    // Change tab handler
    const handleTabChange = (tab: string) => {
        setActiveTab(tab)
    }

    return (
        <div className="container mx-auto p-4 md:p-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold">Tableau de bord administrateur</h1>
                <p className="text-muted-foreground mt-2">
                    Gérez l'ensemble des données de l'application MatchRoom
                </p>
            </header>

            <Tabs
                defaultValue="users"
                className="space-y-4"
                value={activeTab}
                onValueChange={handleTabChange}
            >
                <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    <TabsTrigger value="users" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="hidden md:inline">Utilisateurs</span>
                    </TabsTrigger>
                    <TabsTrigger value="hotels" className="flex items-center gap-2">
                        <Hotel className="h-4 w-4" />
                        <span className="hidden md:inline">Hôtels</span>
                    </TabsTrigger>
                    <TabsTrigger value="rooms" className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        <span className="hidden md:inline">Chambres</span>
                    </TabsTrigger>
                    <TabsTrigger value="types" className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4" />
                        <span className="hidden md:inline">Types</span>
                    </TabsTrigger>
                    <TabsTrigger value="bookings" className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span className="hidden md:inline">Réservations</span>
                    </TabsTrigger>
                    <TabsTrigger value="negotiations" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden md:inline">Négociations</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Gestion des utilisateurs
                            </CardTitle>
                            <CardDescription>
                                Gérer les comptes utilisateurs, leurs rôles et leurs informations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UsersTab />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="hotels" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Hotel className="h-5 w-5" />
                                Gestion des hôtels
                            </CardTitle>
                            <CardDescription>
                                Gérer les hôtels, leurs informations et leurs associations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <HotelsTab />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rooms" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="h-5 w-5" />
                                Gestion des chambres
                            </CardTitle>
                            <CardDescription>
                                Gérer les chambres, leurs tarifs et leurs caractéristiques
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RoomsTab />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="types" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckSquare className="h-5 w-5" />
                                Gestion des types de chambres
                            </CardTitle>
                            <CardDescription>
                                Gérer les différents types de chambres disponibles
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TypesTab />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="negotiations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Gestion des négociations
                            </CardTitle>
                            <CardDescription>
                                Gérer les négociations de prix en cours et terminées
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <NegotiationsTab />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}