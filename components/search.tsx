"use client"

import { SearchIcon } from "lucide-react"

interface SearchProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  className?: string
}

export default function Search({ searchTerm, setSearchTerm, className = "" }: SearchProps) {
  return (
    <div className={`airbnb-search flex items-center px-4 py-3 border border-gray-300 rounded-full ${className}`}>
      <SearchIcon className="h-4 w-4 text-gray-500 mr-2" />
      <input
        type="text"
        placeholder="Rechercher une chambre..."
        className="w-full outline-none text-sm bg-transparent"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm("")}
          className="ml-2 text-xs bg-gray-200 rounded-full h-5 w-5 flex items-center justify-center"
        >
          ×
        </button>
      )}
    </div>
  )
}
