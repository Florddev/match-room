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

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minRate, setMinRate] = useState<number>(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState<string>("");
  const [tagSearchTerm, setTagSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showCategoryDropdown, setShowCategoryDropdown] =
    useState<boolean>(false);
  const [showTagDropdown, setShowTagDropdown] = useState<boolean>(false);

  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [uniqueTags, setUniqueTags] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(1000);

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

        const categories = [
          ...new Set(
            data.flatMap((room) =>
              room.categories.split(",").map((category) => category.trim())
            )
          ),
        ];
        setUniqueCategories(categories);

        const tags = [
          ...new Set(
            data.flatMap((room) =>
              room.tags.split(",").map((tag) => tag.trim())
            )
          ),
        ];
        setUniqueTags(tags);

        const highestPrice = Math.max(...data.map((room) => room.price));
        setMaxPrice(Math.ceil(highestPrice / 100) * 100);
        setPriceRange([0, Math.ceil(highestPrice / 100) * 100]);
      } catch (error) {
        console.error(error);
      }
    }
    fetchRooms();
  }, []);

  useEffect(() => {
    // Fermer les dropdowns lors d'un clic en dehors
    function handleClickOutside(event: MouseEvent) {
      if (showCategoryDropdown || showTagDropdown) {
        // @ts-ignore
        if (event.target && !event.target.closest(".dropdown-container")) {
          setShowCategoryDropdown(false);
          setShowTagDropdown(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCategoryDropdown, showTagDropdown]);

  useEffect(() => {
    let results = rooms;

    results = results.filter((room) => {
      const priceInRange =
        room.price >= priceRange[0] && room.price <= priceRange[1];

      const rateHighEnough = room.rate >= minRate;

      const categoryMatch =
        selectedCategories.length === 0 ||
        selectedCategories.some((cat) =>
          room.categories
            .split(",")
            .map((c) => c.trim())
            .includes(cat)
        );

      const roomTags = room.tags.split(",").map((tag) => tag.trim());
      const tagMatch =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => roomTags.includes(tag));

      return priceInRange && rateHighEnough && categoryMatch && tagMatch;
    });

    const term = searchTerm.trim();
    if (term !== "") {
      const searchWords = term.toLowerCase().split(/\s+/);

      results = results.filter((room) => {
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
            ...room.categories.split(",").flatMap((cat) =>
              cat
                .trim()
                .toLowerCase()
                .split(/\s+/)
                .map((catWord) => calculateSimilarity(word, catWord))
            ),
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

      results = results.sort((a, b) => {
        const aRelevance = calculateOverallRelevance(a, searchWords);
        const bRelevance = calculateOverallRelevance(b, searchWords);
        return bRelevance - aRelevance;
      });
    } else {
      results = results.sort((a, b) => {
        if (b.rate !== a.rate) return b.rate - a.rate;
        return a.price - b.price;
      });
    }

    setFilteredRooms(results);
  }, [
    searchTerm,
    rooms,
    priceRange,
    minRate,
    selectedCategories,
    selectedTags,
  ]);

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
      const categoriesSimilarities = room.categories.split(",").flatMap((cat) =>
        cat
          .trim()
          .toLowerCase()
          .split(/\s+/)
          .map((catWord) => calculateSimilarity(word, catWord))
      );
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

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleTagChange = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const resetFilters = () => {
    setPriceRange([0, maxPrice]);
    setMinRate(0);
    setSelectedCategories([]);
    setSelectedTags([]);
    setSearchTerm("");
    setCategorySearchTerm("");
    setTagSearchTerm("");
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <input
            type="text"
            placeholder="Rechercher une chambre..."
            className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
          </button>
        </div>

        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-lg mb-3">Filtres</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix: {priceRange[0]} € - {priceRange[1]} €
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="0"
                  max={maxPrice}
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([parseInt(e.target.value), priceRange[1]])
                  }
                  className="w-1/2 mr-2"
                />
                <input
                  type="range"
                  min="0"
                  max={maxPrice}
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], parseInt(e.target.value)])
                  }
                  className="w-1/2"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note minimale: {minRate}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={minRate}
                onChange={(e) => setMinRate(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {uniqueCategories.length > 0 && (
              <div className="mb-4 relative dropdown-container">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégories{" "}
                  {selectedCategories.length > 0 &&
                    `(${selectedCategories.length} sélectionnée${
                      selectedCategories.length > 1 ? "s" : ""
                    })`}
                </label>
                <div
                  className="p-2 border rounded flex justify-between items-center cursor-pointer"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <div className="truncate">
                    {selectedCategories.length === 0
                      ? "Sélectionner une catégorie"
                      : selectedCategories.length === 1
                      ? selectedCategories[0]
                      : `${selectedCategories.length} catégories sélectionnées`}
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showCategoryDropdown ? "transform rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {showCategoryDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="sticky top-0 bg-white p-2 border-b">
                      <input
                        type="text"
                        placeholder="Rechercher une catégorie..."
                        className="w-full p-2 border rounded text-sm"
                        value={categorySearchTerm}
                        onChange={(e) => setCategorySearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      {uniqueCategories
                        .filter((category) =>
                          category
                            .toLowerCase()
                            .includes(categorySearchTerm.toLowerCase())
                        )
                        .map((category) => (
                          <div
                            key={category}
                            className={`p-2 hover:bg-gray-100 cursor-pointer ${
                              selectedCategories.includes(category)
                                ? "bg-blue-50"
                                : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryChange(category);
                            }}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedCategories.includes(category)}
                                onChange={() => {}}
                                className="mr-2"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span>{category}</span>
                            </div>
                          </div>
                        ))}
                      {uniqueCategories.filter((category) =>
                        category
                          .toLowerCase()
                          .includes(categorySearchTerm.toLowerCase())
                      ).length === 0 && (
                        <div className="p-2 text-gray-500 text-center">
                          Aucune catégorie trouvée
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {uniqueTags.length > 0 && (
              <div className="mb-4 relative dropdown-container">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags{" "}
                  {selectedTags.length > 0 &&
                    `(${selectedTags.length} sélectionné${
                      selectedTags.length > 1 ? "s" : ""
                    })`}
                </label>
                <div
                  className="p-2 border rounded flex justify-between items-center cursor-pointer"
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                >
                  <div className="truncate">
                    {selectedTags.length === 0
                      ? "Sélectionner un tag"
                      : selectedTags.length === 1
                      ? selectedTags[0]
                      : `${selectedTags.length} tags sélectionnés`}
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showTagDropdown ? "transform rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {showTagDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="sticky top-0 bg-white p-2 border-b">
                      <input
                        type="text"
                        placeholder="Rechercher un tag..."
                        className="w-full p-2 border rounded text-sm"
                        value={tagSearchTerm}
                        onChange={(e) => setTagSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      {uniqueTags
                        .filter((tag) =>
                          tag
                            .toLowerCase()
                            .includes(tagSearchTerm.toLowerCase())
                        )
                        .map((tag) => (
                          <div
                            key={tag}
                            className={`p-2 hover:bg-gray-100 cursor-pointer ${
                              selectedTags.includes(tag) ? "bg-blue-50" : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTagChange(tag);
                            }}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedTags.includes(tag)}
                                onChange={() => {}}
                                className="mr-2"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span>{tag}</span>
                            </div>
                          </div>
                        ))}
                      {uniqueTags.filter((tag) =>
                        tag.toLowerCase().includes(tagSearchTerm.toLowerCase())
                      ).length === 0 && (
                        <div className="p-2 text-gray-500 text-center">
                          Aucun tag trouvé
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={resetFilters}
              className="mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        <div className="text-sm text-gray-500">
          {filteredRooms.length} chambre{filteredRooms.length !== 1 ? "s" : ""}{" "}
          trouvée{filteredRooms.length !== 1 ? "s" : ""}
        </div>
      </div>

      {filteredRooms.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          Aucune chambre ne correspond à vos critères de recherche.
        </p>
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
                {room.categories.split(",").map((category, index) => (
                  <span
                    key={`cat-${index}`}
                    className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded mr-2 mb-1"
                  >
                    {category.trim()}
                  </span>
                ))}
                {room.tags.split(",").map((tag, index) => (
                  <span
                    key={`tag-${index}`}
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
