import type React from "react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6">{children}</div>
  )
}
