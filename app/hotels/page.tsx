"use client";
import React, { useState, useEffect } from "react";

// Définition du type Hotel selon votre modèle Prisma
type Hotel = {
  id: string;
  name: string;
  rate: number;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
};

// Fonction pour calculer la distance de Levenshtein
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialisation de la matrice
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Remplissage de la matrice
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // suppression
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

// Fonction pour calculer la similarité basée sur la distance de Levenshtein
function calculateSimilarity(term: string, text: string): number {
  if (!term || !text) return 0;

  const distance = levenshteinDistance(term.toLowerCase(), text.toLowerCase());
  const maxLength = Math.max(term.length, text.length);

  // Retourne une valeur entre 0 et 1, où 1 est une correspondance parfaite
  return 1 - distance / maxLength;
}

export default function HotelsList() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const similarityThreshold = 0.5; // Fixé à 30% de tolérance (0.7 = 70% de similarité requise)

  // Récupère les données via l'API Next.js + Prisma
  useEffect(() => {
    async function fetchHotels() {
      try {
        const res = await fetch("/api/hotels", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Erreur lors du chargement des hôtels");
        const data: Hotel[] = await res.json();
        setHotels(data);
        setFilteredHotels(data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchHotels();
  }, []);

  useEffect(() => {
    const term = searchTerm.trim();

    if (term === "") {
      setFilteredHotels(hotels);
      return;
    }

    const searchWords = term.toLowerCase().split(/\s+/);

    const results = hotels.filter((hotel) => {
      // Pour chaque mot de recherche, chercher s'il y a correspondance dans les champs
      return searchWords.some((word) => {
        // Vérifier la similarité dans chaque champ pertinent
        const nameSimilarity = Math.max(
          ...hotel.name
            .toLowerCase()
            .split(/\s+/)
            .map((nameWord) => calculateSimilarity(word, nameWord)),
          0
        );

        const addressSimilarity = Math.max(
          ...hotel.address
            .toLowerCase()
            .split(/\s+/)
            .map((addrWord) => calculateSimilarity(word, addrWord)),
          0
        );

        const citySimilarity = Math.max(
          ...hotel.city
            .toLowerCase()
            .split(/\s+/)
            .map((cityWord) => calculateSimilarity(word, cityWord)),
          0
        );

        const zipCodeSimilarity = calculateSimilarity(word, hotel.zipCode);

        const phoneSimilarity = calculateSimilarity(word, hotel.phone);

        // Retourner true si l'un des champs dépasse le seuil de similarité
        return (
          nameSimilarity >= similarityThreshold ||
          addressSimilarity >= similarityThreshold ||
          citySimilarity >= similarityThreshold ||
          zipCodeSimilarity >= similarityThreshold ||
          phoneSimilarity >= similarityThreshold
        );
      });
    });

    // Triez les résultats par pertinence
    const sortedResults = results.sort((a, b) => {
      const aRelevance = calculateOverallRelevance(a, searchWords);
      const bRelevance = calculateOverallRelevance(b, searchWords);
      return bRelevance - aRelevance; // Ordre décroissant
    });

    setFilteredHotels(sortedResults);
  }, [searchTerm, hotels]);

  // Calcule la pertinence globale d'un hôtel pour le tri
  function calculateOverallRelevance(
    hotel: Hotel,
    searchWords: string[]
  ): number {
    let totalRelevance = 0;

    searchWords.forEach((word) => {
      const nameSimilarities = hotel.name
        .toLowerCase()
        .split(/\s+/)
        .map((nameWord) => calculateSimilarity(word, nameWord));

      const addressSimilarities = hotel.address
        .toLowerCase()
        .split(/\s+/)
        .map((addrWord) => calculateSimilarity(word, addrWord));

      const citySimilarities = hotel.city
        .toLowerCase()
        .split(/\s+/)
        .map((cityWord) => calculateSimilarity(word, cityWord));

      const zipCodeSimilarity = calculateSimilarity(word, hotel.zipCode);
      const phoneSimilarity = calculateSimilarity(word, hotel.phone);

      // Poids différents pour les différents champs
      totalRelevance += Math.max(...nameSimilarities, 0) * 3; // Le nom est plus important
      totalRelevance += Math.max(...addressSimilarities, 0) * 2; // L'adresse est assez importante
      totalRelevance += Math.max(...citySimilarities, 0) * 2; // La ville est assez importante
      totalRelevance += zipCodeSimilarity * 1.5; // Le code postal peut être pertinent
      totalRelevance += phoneSimilarity; // Le téléphone est moins prioritaire pour la recherche
    });

    return totalRelevance;
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher un hôtel..."
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredHotels.length === 0 ? (
        <p className="text-center text-gray-500">Aucun hôtel trouvé.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHotels.map((hotel) => (
            <div
              key={hotel.id}
              className="border rounded-lg shadow-sm p-4 hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold mb-2">{hotel.name}</h2>
              <div className="flex items-center mb-2">
                <span className="font-bold">{hotel.rate}/5</span>
                <div className="ml-2 flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 ${
                        i < Math.round(hotel.rate)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-1">{hotel.address}</p>
              <p className="text-gray-600 mb-1">
                {hotel.zipCode} {hotel.city}
              </p>
              <p className="text-gray-600 mb-2">{hotel.phone}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
