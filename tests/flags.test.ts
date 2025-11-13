import { describe, it, expect } from "vitest";
import {
  countries,
  getRandomCountry,
  isAnswerCorrect,
  getCountryByName,
  type CountryFlags
} from "../src/lib/flags";

// ============================================
// Test Suite 1: Data Structure Validation
// ============================================
describe("Countries Data", () => {
  it("should have at least one country", () => {
    expect(countries.length).toBeGreaterThan(0);
  });

  it("should have valid structure for all countries", () => {
    countries.forEach((country) => {
      // Every country must have a name
      expect(country.name).toBeDefined();
      expect(typeof country.name).toBe("string");
      expect(country.name.length).toBeGreaterThan(0);

      // Every country must have an emoji
      expect(country.emoji).toBeDefined();
      expect(typeof country.emoji).toBe("string");
      expect(country.emoji.length).toBeGreaterThan(0);

      // Alternate names are optional, but if present, must be an array
      if (country.alternate_names) {
        expect(Array.isArray(country.alternate_names)).toBe(true);
      }
    });
  });

  it("should have unique country names", () => {
    const names = countries.map((c) => c.name.toLowerCase());
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it("should have valid flag emojis", () => {
    countries.forEach((country) => {
      // Flag emojis typically have length of 4 (surrogate pairs)
      // This is a basic check - might need adjustment
      expect(country.emoji.length).toBeGreaterThanOrEqual(2);
    });
  });
});

// ============================================
// Test Suite 2: getRandomCountry Function
// ============================================
describe("getRandomCountry()", () => {
  it("should return a valid country object", () => {
    const country = getRandomCountry();

    expect(country).toBeDefined();
    expect(country.name).toBeDefined();
    expect(country.emoji).toBeDefined();
  });

  it("should return a country from the countries list", () => {
    const country = getRandomCountry();
    const exists = countries.some((c) => c.name === country.name);

    expect(exists).toBe(true);
  });

  it("should return different countries on multiple calls (randomness check)", () => {
    // This test has a small chance of false positive if we only have 1 country
    // or get very unlucky with randomness
    if (countries.length <= 1) {
      // Skip this test if we don't have enough countries
      return;
    }

    const results = new Set<string>();
    const iterations = Math.min(20, countries.length * 3);

    for (let i = 0; i < iterations; i++) {
      results.add(getRandomCountry().name);
    }

    // With enough iterations, we should see at least 2 different countries
    expect(results.size).toBeGreaterThan(1);
  });
});

// ============================================
// Test Suite 3: isAnswerCorrect Function
// ============================================
describe("isAnswerCorrect()", () => {
  // Get a known country for testing
  const testCountry: CountryFlags = {
    name: "United States",
    emoji: "🇺🇸",
    alternate_names: ["USA", "United States of America", "America"]
  };

  // ---- Positive test cases (should return true) ----
  it("should return true for exact match", () => {
    expect(isAnswerCorrect("United States", testCountry)).toBe(true);
  });

  it("should be case-insensitive for correct answers", () => {
    expect(isAnswerCorrect("united states", testCountry)).toBe(true);
    expect(isAnswerCorrect("UNITED STATES", testCountry)).toBe(true);
    expect(isAnswerCorrect("UnItEd StAtEs", testCountry)).toBe(true);
  });

  it("should handle leading/trailing whitespace", () => {
    expect(isAnswerCorrect("  United States  ", testCountry)).toBe(true);
    expect(isAnswerCorrect("\tUnited States\n", testCountry)).toBe(true);
  });

  it("should accept alternate names", () => {
    expect(isAnswerCorrect("USA", testCountry)).toBe(true);
    expect(isAnswerCorrect("United States of America", testCountry)).toBe(true);
    expect(isAnswerCorrect("America", testCountry)).toBe(true);
  });

  it("should be case-insensitive for alternate names", () => {
    expect(isAnswerCorrect("usa", testCountry)).toBe(true);
    expect(isAnswerCorrect("AMERICA", testCountry)).toBe(true);
  });

  // ---- Negative test cases (should return false) ----
  it("should return false for incorrect answers", () => {
    expect(isAnswerCorrect("Canada", testCountry)).toBe(false);
    expect(isAnswerCorrect("Mexico", testCountry)).toBe(false);
    expect(isAnswerCorrect("France", testCountry)).toBe(false);
  });

  it("should return false for partial matches", () => {
    expect(isAnswerCorrect("United", testCountry)).toBe(false);
    expect(isAnswerCorrect("States", testCountry)).toBe(false);
    expect(isAnswerCorrect("US", testCountry)).toBe(false); // Not in alternates
  });

  it("should return false for empty string", () => {
    expect(isAnswerCorrect("", testCountry)).toBe(false);
  });

  it("should return false for only whitespace", () => {
    expect(isAnswerCorrect("   ", testCountry)).toBe(false);
    expect(isAnswerCorrect("\t\n", testCountry)).toBe(false);
  });

  // ---- Edge cases ----
  it("should handle country with no alternate names", () => {
    const simpleCountry: CountryFlags = {
      name: "Canada",
      emoji: "🇨🇦"
      // No alternate_names
    };

    expect(isAnswerCorrect("Canada", simpleCountry)).toBe(true);
    expect(isAnswerCorrect("CAN", simpleCountry)).toBe(false);
  });

  it("should handle country with empty alternate names array", () => {
    const emptyAlternates: CountryFlags = {
      name: "Japan",
      emoji: "🇯🇵",
      alternate_names: []
    };

    expect(isAnswerCorrect("Japan", emptyAlternates)).toBe(true);
    expect(isAnswerCorrect("JP", emptyAlternates)).toBe(false);
  });
});

// ============================================
// Test Suite 4: getCountryByName Function
// ============================================
describe("getCountryByName()", () => {
  it("should find country by exact name match", () => {
    const country = getCountryByName("United States");

    expect(country).toBeDefined();
    expect(country?.name).toBe("United States");
    expect(country?.emoji).toBe("🇺🇸");
  });

  it("should be case-insensitive", () => {
    const lower = getCountryByName("united states");
    const upper = getCountryByName("UNITED STATES");
    const mixed = getCountryByName("UnItEd StAtEs");

    expect(lower).toBeDefined();
    expect(upper).toBeDefined();
    expect(mixed).toBeDefined();
    expect(lower?.name).toBe("United States");
    expect(upper?.name).toBe("United States");
    expect(mixed?.name).toBe("United States");
  });

  it("should return undefined for non-existent country", () => {
    const result = getCountryByName("Atlantis");
    expect(result).toBeUndefined();
  });

  it("should find all countries in the list", () => {
    countries.forEach((country) => {
      const found = getCountryByName(country.name);
      expect(found).toBeDefined();
      expect(found?.name).toBe(country.name);
    });
  });

  it("should handle leading/trailing whitespace (based on implementation)", () => {
    const withSpaces = getCountryByName("  United States  ");

    // If this fails, consider updating getCountryByName to trim inputs
    expect(withSpaces).toBeUndefined();
  });
});

// ============================================
// Test Suite 5: Integration Tests
// ============================================
describe("Integration: Game Flow Simulation", () => {
  it("should support a complete game round", () => {
    // 1. Get a random country
    const country = getRandomCountry();
    expect(country).toBeDefined();

    // 2. Simulate correct answer
    const correctAnswer = isAnswerCorrect(country.name, country);
    expect(correctAnswer).toBe(true);

    // 3. Simulate incorrect answer
    const wrongAnswer = isAnswerCorrect("NotACountry123", country);
    expect(wrongAnswer).toBe(false);

    // 4. Look up country by name
    const lookedUp = getCountryByName(country.name);
    expect(lookedUp).toBeDefined();
    expect(lookedUp?.emoji).toBe(country.emoji);
  });

  it("should handle alternate names in game flow", () => {
    // Find a country with alternate names
    const countryWithAlts = countries.find(
      (c) => c.alternate_names && c.alternate_names.length > 0
    );

    if (!countryWithAlts || !countryWithAlts.alternate_names) {
      // Skip if no countries have alternates
      return;
    }

    // Test that alternate name is accepted
    const alternateAnswer = countryWithAlts.alternate_names[0];
    expect(isAnswerCorrect(alternateAnswer, countryWithAlts)).toBe(true);
  });
});
