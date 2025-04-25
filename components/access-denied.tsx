import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="mb-6">
        <AlertTriangle className="w-16 h-16 text-red-500" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Accès refusé</h1>
      <p className="text-lg mb-6 max-w-md">
        Vous n'avez pas les autorisations nécessaires pour accéder à cette page. Seuls les utilisateurs avec le rôle
        Manager peuvent accéder au dashboard.
      </p>
      <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
        Retour à l'accueil
      </Link>
    </div>
  )
}
