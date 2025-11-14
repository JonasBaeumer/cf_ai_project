export interface CountryFlags {
  name: string;
  emoji: string;
  code: string; // ISO 3166-1 alpha-2 country code
  alternate_names?: string[];
}

// This is the list of countries and flags that are available in this game
export const countries: CountryFlags[] = [
  // North America
  {
    name: "United States",
    emoji: "🇺🇸",
    code: "us",
    alternate_names: ["USA", "United States of America", "America", "US"]
  },
  {
    name: "Canada",
    emoji: "🇨🇦",
    code: "ca",
    alternate_names: ["CAN"]
  },
  {
    name: "Mexico",
    emoji: "🇲🇽",
    code: "mx",
    alternate_names: ["MEX", "Estados Unidos Mexicanos"]
  },
  // Europe
  {
    name: "United Kingdom",
    emoji: "🇬🇧",
    code: "gb",
    alternate_names: [
      "UK",
      "United Kingdom of Great Britain and Northern Ireland",
      "Britain",
      "Great Britain",
      "England"
    ]
  },
  {
    name: "Germany",
    emoji: "🇩🇪",
    code: "de",
    alternate_names: ["Deutschland", "GER"]
  },
  {
    name: "France",
    emoji: "🇫🇷",
    code: "fr",
    alternate_names: ["FRA", "République française"]
  },
  {
    name: "Spain",
    emoji: "🇪🇸",
    code: "es",
    alternate_names: ["España", "ESP", "Kingdom of Spain"]
  },
  {
    name: "Italy",
    emoji: "🇮🇹",
    code: "it",
    alternate_names: ["Italia", "ITA", "Italian Republic"]
  },
  {
    name: "Netherlands",
    emoji: "🇳🇱",
    code: "nl",
    alternate_names: ["Holland", "NL", "NED", "The Netherlands"]
  },
  {
    name: "Sweden",
    emoji: "🇸🇪",
    code: "se",
    alternate_names: ["Sverige", "SWE"]
  },
  {
    name: "Norway",
    emoji: "🇳🇴",
    code: "no",
    alternate_names: ["Norge", "NOR"]
  },
  {
    name: "Switzerland",
    emoji: "🇨🇭",
    code: "ch",
    alternate_names: ["Schweiz", "Suisse", "Svizzera", "SUI", "CH"]
  },
  // Asia
  {
    name: "Japan",
    emoji: "🇯🇵",
    code: "jp",
    alternate_names: ["日本", "Nippon", "Nihon", "JPN"]
  },
  {
    name: "China",
    emoji: "🇨🇳",
    code: "cn",
    alternate_names: ["中国", "People's Republic of China", "PRC", "CHN"]
  },
  {
    name: "South Korea",
    emoji: "🇰🇷",
    code: "kr",
    alternate_names: ["Korea", "Republic of Korea", "한국", "KOR", "ROK"]
  },
  {
    name: "India",
    emoji: "🇮🇳",
    code: "in",
    alternate_names: ["भारत", "Bharat", "IND"]
  },
  {
    name: "Thailand",
    emoji: "🇹🇭",
    code: "th",
    alternate_names: ["ประเทศไทย", "THA", "Siam"]
  },
  {
    name: "Singapore",
    emoji: "🇸🇬",
    code: "sg",
    alternate_names: ["新加坡", "SG", "SGP"]
  },
  // Africa
  {
    name: "South Africa",
    emoji: "🇿🇦",
    code: "za",
    alternate_names: ["RSA", "ZA", "Republic of South Africa"]
  },
  {
    name: "Egypt",
    emoji: "🇪🇬",
    code: "eg",
    alternate_names: ["مصر", "EGY", "Arab Republic of Egypt"]
  },
  {
    name: "Nigeria",
    emoji: "🇳🇬",
    code: "ng",
    alternate_names: ["NGA", "NG"]
  },
  {
    name: "Kenya",
    emoji: "🇰🇪",
    code: "ke",
    alternate_names: ["KEN", "KE", "Republic of Kenya"]
  },
  {
    name: "Madagascar",
    emoji: "🇲🇬",
    code: "mg",
    alternate_names: ["Madagaskar", "MDG"]
  },
  {
    name: "Zimbabwe",
    emoji: "🇿🇼",
    code: "zw",
    alternate_names: ["ZIM", "ZW"]
  },
  // South America
  {
    name: "Brazil",
    emoji: "🇧🇷",
    code: "br",
    alternate_names: ["Brasil", "BRA", "Federative Republic of Brazil"]
  },
  {
    name: "Argentina",
    emoji: "🇦🇷",
    code: "ar",
    alternate_names: ["ARG", "Argentine Republic"]
  },
  {
    name: "Chile",
    emoji: "🇨🇱",
    code: "cl",
    alternate_names: ["CHI", "CHL", "Republic of Chile"]
  },
  {
    name: "Peru",
    emoji: "🇵🇪",
    code: "pe",
    alternate_names: ["Perú", "PER", "Republic of Peru"]
  },
  // Oceania
  {
    name: "Australia",
    emoji: "🇦🇺",
    code: "au",
    alternate_names: ["AUS", "Commonwealth of Australia", "Oz"]
  },
  {
    name: "New Zealand",
    emoji: "🇳🇿",
    code: "nz",
    alternate_names: ["NZ", "NZL", "Aotearoa"]
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
