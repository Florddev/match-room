"use client";

interface SearchProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    className?: string;
}

export default function Search({ searchTerm, setSearchTerm, className = "" }: SearchProps) {
    return (
        <input
            type="text"
            placeholder="Rechercher une chambre..."
            className={`p-2 border rounded-lg focus:outline-none focus:ring ${className}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
    );
}