"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"

interface OverviewProps {
  data: {
    month: string
    bookings: number
    revenue: number
  }[]
}

export function Overview({ data }: OverviewProps) {
  // Formater les données pour le graphique
  const chartData = data.map((item) => ({
    ...item,
    revenue: item.revenue / 100, // Convertir en centaines pour une meilleure lisibilité
  }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <Tooltip
          formatter={(value, name) => {
            if (name === "revenue") {
              return [`$${((value as number) * 100).toFixed(2)}`, "Revenus"]
            }
            return [value, name === "bookings" ? "Réservations" : name]
          }}
          labelFormatter={(label) => `Mois: ${label}`}
        />
        <Legend
          formatter={(value) => {
            return value === "bookings" ? "Réservations" : "Revenus (x100)"
          }}
        />
        <Bar dataKey="bookings" name="bookings" fill="#8884d8" radius={[4, 4, 0, 0]} />
        <Bar dataKey="revenue" name="revenue" fill="#82ca9d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
