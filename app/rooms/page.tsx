"use client";
import React, { useState, useEffect } from "react";

type Room = {
  id: string;
  name: string;
  price: number;
  rate: number;
  content: string;
  categories: string;
  tags: string;
  hotelId: string;
  createdAt: string;
  updatedAt: string;
};

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}

function calculateSimilarity(term: string, text: string): number {
  if (!term || !text) return 0;

  const distance = levenshteinDistance(term.toLowerCase(), text.toLowerCase());
  const maxLength = Math.max(term.length, text.length);

  return 1 - distance / maxLength;
}

export default function HotelRoomsList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const similarityThreshold = 0.5;

  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch("/api/rooms", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Erreur lors du chargement des chambres");
        const data: Room[] = await res.json();
        setRooms(data);
        setFilteredRooms(data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchRooms();
  }, []);

  useEffect(() => {
    const term = searchTerm.trim();

    if (term === "") {
      setFilteredRooms(rooms);
      return;
    }

    const searchWords = term.toLowerCase().split(/\s+/);

    const results = rooms.filter((room) => {
      return searchWords.some((word) => {
        const nameSimilarity = Math.max(
          ...room.name
            .toLowerCase()
            .split(/\s+/)
            .map((nameWord) => calculateSimilarity(word, nameWord)),
          0
        );

        const contentSimilarity = Math.max(
          ...room.content
            .toLowerCase()
            .split(/\s+/)
            .map((contentWord) => calculateSimilarity(word, contentWord)),
          0
        );

        const categoriesSimilarity = Math.max(
          ...room.categories
            .toLowerCase()
            .split(/\s+/)
            .map((catWord) => calculateSimilarity(word, catWord)),
          0
        );

        const tagsSimilarity = Math.max(
          ...room.tags
            .toLowerCase()
            .split(/\s+/)
            .map((tagWord) => calculateSimilarity(word, tagWord)),
          0
        );

        const priceStr = room.price.toString();
        const priceSimilarity = calculateSimilarity(word, priceStr);

        const rateStr = room.rate.toString();
        const rateSimilarity = calculateSimilarity(word, rateStr);

        return (
          nameSimilarity >= similarityThreshold ||
          contentSimilarity >= similarityThreshold ||
          categoriesSimilarity >= similarityThreshold ||
          tagsSimilarity >= similarityThreshold ||
          priceSimilarity >= similarityThreshold ||
          rateSimilarity >= similarityThreshold
        );
      });
    });

    const sortedResults = results.sort((a, b) => {
      const aRelevance = calculateOverallRelevance(a, searchWords);
      const bRelevance = calculateOverallRelevance(b, searchWords);
      return bRelevance - aRelevance; // Ordre décroissant
    });

    setFilteredRooms(sortedResults);
  }, [searchTerm, rooms]);

  function calculateOverallRelevance(
    room: Room,
    searchWords: string[]
  ): number {
    let totalRelevance = 0;

    searchWords.forEach((word) => {
      const nameSimilarities = room.name
        .toLowerCase()
        .split(/\s+/)
        .map((nameWord) => calculateSimilarity(word, nameWord));

      const contentSimilarities = room.content
        .toLowerCase()
        .split(/\s+/)
        .map((contentWord) => calculateSimilarity(word, contentWord));

      const categoriesSimilarities = room.categories
        .toLowerCase()
        .split(/\s+/)
        .map((catWord) => calculateSimilarity(word, catWord));

      const tagsSimilarities = room.tags
        .toLowerCase()
        .split(/\s+/)
        .map((tagWord) => calculateSimilarity(word, tagWord));

      const priceStr = room.price.toString();
      const priceSimilarity = calculateSimilarity(word, priceStr);

      const rateStr = room.rate.toString();
      const rateSimilarity = calculateSimilarity(word, rateStr);

      totalRelevance += Math.max(...nameSimilarities, 0) * 3; 
      totalRelevance += Math.max(...contentSimilarities, 0) * 2;
      totalRelevance += Math.max(...categoriesSimilarities, 0) * 2.5; 
      totalRelevance += Math.max(...tagsSimilarities, 0) * 2; 
      totalRelevance += priceSimilarity * 1.5;
      totalRelevance += rateSimilarity * 1;
    });

    return totalRelevance;
  }

  return (
    <div className="p-4">
      <input
        type="text"
        placeholder="Rechercher une chambre..."
        className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {filteredRooms.length === 0 ? (
        <p className="text-center text-gray-500">Aucune chambre trouvée.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="border rounded-lg shadow-sm p-4 hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold mb-2">{room.name}</h2>
              <div className="flex items-center mb-2">
                <span className="font-bold">{room.rate}/5</span>
                <div className="ml-2 flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 ${
                        i < Math.round(room.rate)
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
              <p className="text-gray-600 mb-3">
                {room.content.length > 150
                  ? room.content.substring(0, 150) + "..."
                  : room.content}
              </p>
              <div className="mb-3">
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded mr-2 mb-1">
                  {room.categories}
                </span>
                {room.tags.split(",").map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
              <p className="font-bold text-lg">{room.price} € / nuit</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
