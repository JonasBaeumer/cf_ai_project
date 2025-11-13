export interface CountryFlags {
  name: string;
  emoji: string;
  alternate_names?: string[];
}

// This is the list of countries and flags that are available in this game
export const countries: CountryFlags[] = [
  {
    name: "United States",
    emoji: "🇺🇸",
    alternate_names: ["USA", "United States of America", "America"]
  },
  {
    name: "Canada",
    emoji: "🇨🇦"
  },
  {
    name: "United Kingdom",
    emoji: "🇬🇧",
    alternate_names: [
      "UK",
      "United Kingdom of Great Britain and Northern Ireland",
      "Britain"
    ]
  },
  {
    name: "Germany",
    emoji: "🇩🇪",
    alternate_names: ["Germany", "Deutschland"]
  },
  {
    name: "Madagascar",
    emoji: "🇲🇬",
    alternate_names: ["Madagascar", "Madagaskar"]
  },
  {
    name: "Zimbabwe",
    emoji: "🇿🇼",
    alternate_names: ["Zimbabwe", "Zimbabwae"]
  }
];

export function getRandomCountry(): CountryFlags {
  const shuffled = [...countries];

  // Fisher-Yates shuffle algorithm: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled[0];
}

export function isAnswerCorrect(
  answer: string,
  country: CountryFlags
): boolean {
  const normalizedAnswer = answer.trim().toLowerCase();
  const normalizedCountryName = country.name.trim().toLowerCase();

  if (normalizedAnswer === normalizedCountryName) {
    return true;
  }

  for (const alternateName of country.alternate_names || []) {
    const normalizedAlternateName = alternateName.trim().toLowerCase();
    if (normalizedAnswer === normalizedAlternateName) {
      return true;
    }
  }

  return false;
}

/**
 * Get a country flags object by name
 * @param name - The name of the country to search for
 * @returns The country flags object if found, undefined otherwise
 */
export function getCountryByName(name: string): CountryFlags | undefined {
  return countries.find((c) => c.name.toLowerCase() === name.toLowerCase());
}
