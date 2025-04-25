import type React from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface DashboardHeaderProps {
  title: string
  description?: string
  backHref?: string
  actions?: React.ReactNode
}

export function DashboardHeader({ title, description, backHref, actions }: DashboardHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {backHref && (
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href={backHref}>
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Retour</span>
              </Link>
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            </div>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <Separator className="my-4" />
    </div>
  )
}
