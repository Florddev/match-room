// app/dashboard/admin/layout.tsx
import { ReactNode } from "react"

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto py-4">
                {children}
            </div>
        </div>
    )
}