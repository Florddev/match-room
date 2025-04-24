"use client";
import React, { useState, useEffect } from "react";

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

export default function HotelsList() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const similarityThreshold = 0.5;

  const [minRate, setMinRate] = useState<number>(0);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>([]);
  const [citySearchTerm, setCitySearchTerm] = useState<string>("");
  const [zipSearchTerm, setZipSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);
  const [showZipDropdown, setShowZipDropdown] = useState<boolean>(false);

  const [uniqueCities, setUniqueCities] = useState<string[]>([]);
  const [uniqueZipCodes, setUniqueZipCodes] = useState<string[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showCityDropdown || showZipDropdown) {
        // @ts-ignore
        if (event.target && !event.target.closest(".dropdown-container")) {
          setShowCityDropdown(false);
          setShowZipDropdown(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCityDropdown, showZipDropdown]);

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

        const cities = [...new Set(data.map((hotel) => hotel.city))];
        setUniqueCities(cities);

        const zipCodes = [...new Set(data.map((hotel) => hotel.zipCode))];
        setUniqueZipCodes(zipCodes);
      } catch (error) {
        console.error(error);
      }
    }
    fetchHotels();
  }, []);

  useEffect(() => {
    let results = hotels;

    results = results.filter((hotel) => {
      const rateHighEnough = hotel.rate >= minRate;

      const cityMatch =
        selectedCities.length === 0 || selectedCities.includes(hotel.city);

      const zipCodeMatch =
        selectedZipCodes.length === 0 ||
        selectedZipCodes.includes(hotel.zipCode);

      return rateHighEnough && cityMatch && zipCodeMatch;
    });

    const term = searchTerm.trim();
    if (term !== "") {
      const searchWords = term.toLowerCase().split(/\s+/);

      results = results.filter((hotel) => {
        return searchWords.some((word) => {
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

          return (
            nameSimilarity >= similarityThreshold ||
            addressSimilarity >= similarityThreshold ||
            citySimilarity >= similarityThreshold ||
            zipCodeSimilarity >= similarityThreshold ||
            phoneSimilarity >= similarityThreshold
          );
        });
      });

      results = results.sort((a, b) => {
        const aRelevance = calculateOverallRelevance(a, searchWords);
        const bRelevance = calculateOverallRelevance(b, searchWords);
        return bRelevance - aRelevance;
      });
    } else {
      results = results.sort((a, b) => b.rate - a.rate);
    }

    setFilteredHotels(results);
  }, [searchTerm, hotels, minRate, selectedCities, selectedZipCodes]);

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

      totalRelevance += Math.max(...nameSimilarities, 0) * 3;
      totalRelevance += Math.max(...addressSimilarities, 0) * 2;
      totalRelevance += Math.max(...citySimilarities, 0) * 2;
      totalRelevance += zipCodeSimilarity * 1.5;
      totalRelevance += phoneSimilarity;
    });

    return totalRelevance;
  }

  const handleCityChange = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const handleZipCodeChange = (zipCode: string) => {
    setSelectedZipCodes((prev) =>
      prev.includes(zipCode)
        ? prev.filter((z) => z !== zipCode)
        : [...prev, zipCode]
    );
  };

  const resetFilters = () => {
    setMinRate(0);
    setSelectedCities([]);
    setSelectedZipCodes([]);
    setSearchTerm("");
    setCitySearchTerm("");
    setZipSearchTerm("");
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <input
            type="text"
            placeholder="Rechercher un hôtel..."
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
                Note minimale: {minRate}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={minRate}
                onChange={(e) => setMinRate(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {uniqueCities.length > 0 && (
              <div className="mb-4 relative dropdown-container">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Villes{" "}
                  {selectedCities.length > 0 &&
                    `(${selectedCities.length} sélectionnée${
                      selectedCities.length > 1 ? "s" : ""
                    })`}
                </label>
                <div
                  className="p-2 border rounded flex justify-between items-center cursor-pointer"
                  onClick={() => setShowCityDropdown(!showCityDropdown)}
                >
                  <div className="truncate">
                    {selectedCities.length === 0
                      ? "Sélectionner une ville"
                      : selectedCities.length === 1
                      ? selectedCities[0]
                      : `${selectedCities.length} villes sélectionnées`}
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showCityDropdown ? "transform rotate-180" : ""
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

                {showCityDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="sticky top-0 bg-white p-2 border-b">
                      <input
                        type="text"
                        placeholder="Rechercher une ville..."
                        className="w-full p-2 border rounded text-sm"
                        value={citySearchTerm}
                        onChange={(e) => setCitySearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      {uniqueCities
                        .filter((city) =>
                          city
                            .toLowerCase()
                            .includes(citySearchTerm.toLowerCase())
                        )
                        .map((city) => (
                          <div
                            key={city}
                            className={`p-2 hover:bg-gray-100 cursor-pointer ${
                              selectedCities.includes(city) ? "bg-blue-50" : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCityChange(city);
                            }}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedCities.includes(city)}
                                onChange={() => {}}
                                className="mr-2"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span>{city}</span>
                            </div>
                          </div>
                        ))}
                      {uniqueCities.filter((city) =>
                        city
                          .toLowerCase()
                          .includes(citySearchTerm.toLowerCase())
                      ).length === 0 && (
                        <div className="p-2 text-gray-500 text-center">
                          Aucune ville trouvée
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {uniqueZipCodes.length > 0 && (
              <div className="mb-4 relative dropdown-container">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Codes postaux{" "}
                  {selectedZipCodes.length > 0 &&
                    `(${selectedZipCodes.length} sélectionné${
                      selectedZipCodes.length > 1 ? "s" : ""
                    })`}
                </label>
                <div
                  className="p-2 border rounded flex justify-between items-center cursor-pointer"
                  onClick={() => setShowZipDropdown(!showZipDropdown)}
                >
                  <div className="truncate">
                    {selectedZipCodes.length === 0
                      ? "Sélectionner un code postal"
                      : selectedZipCodes.length === 1
                      ? selectedZipCodes[0]
                      : `${selectedZipCodes.length} codes postaux sélectionnés`}
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showZipDropdown ? "transform rotate-180" : ""
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

                {showZipDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="sticky top-0 bg-white p-2 border-b">
                      <input
                        type="text"
                        placeholder="Rechercher un code postal..."
                        className="w-full p-2 border rounded text-sm"
                        value={zipSearchTerm}
                        onChange={(e) => setZipSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      {uniqueZipCodes
                        .filter((zipCode) =>
                          zipCode
                            .toLowerCase()
                            .includes(zipSearchTerm.toLowerCase())
                        )
                        .map((zipCode) => (
                          <div
                            key={zipCode}
                            className={`p-2 hover:bg-gray-100 cursor-pointer ${
                              selectedZipCodes.includes(zipCode)
                                ? "bg-blue-50"
                                : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleZipCodeChange(zipCode);
                            }}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedZipCodes.includes(zipCode)}
                                onChange={() => {}}
                                className="mr-2"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span>{zipCode}</span>
                            </div>
                          </div>
                        ))}
                      {uniqueZipCodes.filter((zipCode) =>
                        zipCode
                          .toLowerCase()
                          .includes(zipSearchTerm.toLowerCase())
                      ).length === 0 && (
                        <div className="p-2 text-gray-500 text-center">
                          Aucun code postal trouvé
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
          {filteredHotels.length} hôtel{filteredHotels.length !== 1 ? "s" : ""}{" "}
          trouvé{filteredHotels.length !== 1 ? "s" : ""}
        </div>
      </div>

      {filteredHotels.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          Aucun hôtel ne correspond à vos critères de recherche.
        </p>
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
