import { describe, it, expect } from "vitest";
import {
  calculateScore,
  evaluateRound,
  calculateLeaderboard,
  type PlayerAnswer
} from "../src/lib/game-logic";
import type { CountryFlags } from "../src/lib/flags";

// ============================================
// Test Suite 1: calculateScore Function
// ============================================
describe("calculateScore()", () => {
  it("should return 0 for incorrect answers", () => {
    expect(calculateScore(false, 0)).toBe(0);
    expect(calculateScore(false, 1000)).toBe(0);
    expect(calculateScore(false, 10000)).toBe(0);
  });

  it("should return 200 for instant correct answer (0ms)", () => {
    // Base 100 + speed bonus 100 = 200
    expect(calculateScore(true, 0)).toBe(200);
  });

  it("should calculate speed bonus correctly", () => {
    // 1 second = 1000ms
    // Speed bonus = max(0, 100 - (1000 / 100)) = max(0, 100 - 10) = 90
    expect(calculateScore(true, 1000)).toBe(190); // 100 + 90

    // 5 seconds = 5000ms
    // Speed bonus = max(0, 100 - (5000 / 100)) = max(0, 100 - 50) = 50
    expect(calculateScore(true, 5000)).toBe(150); // 100 + 50

    // 10 seconds = 10000ms
    // Speed bonus = max(0, 100 - (10000 / 100)) = max(0, 100 - 100) = 0
    expect(calculateScore(true, 10000)).toBe(100); // 100 + 0
  });

  it("should cap speed bonus at 0 for very slow answers", () => {
    // Over 10 seconds should still give base points
    expect(calculateScore(true, 15000)).toBe(100);
    expect(calculateScore(true, 20000)).toBe(100);
  });

  it("should give maximum points for very fast answers", () => {
    expect(calculateScore(true, 100)).toBe(199); // 100 + 99
    expect(calculateScore(true, 500)).toBe(195); // 100 + 95
  });
});

// ============================================
// Test Suite 2: evaluateRound Function
// ============================================
describe("evaluateRound()", () => {
  const testCountry: CountryFlags = {
    name: "France",
    emoji: "🇫🇷",
    alternate_names: ["FR", "French Republic"]
  };

  it("should evaluate a single correct answer", () => {
    const answers: PlayerAnswer[] = [
      { playerId: "alice", answer: "France", timestamp: 1000 }
    ];

    const scores = evaluateRound(answers, testCountry, 0);

    expect(scores).toHaveLength(1);
    expect(scores[0].playerId).toBe("alice");
    expect(scores[0].isCorrect).toBe(true);
    expect(scores[0].roundScore).toBe(190); // 100 + (100 - 10)
  });

  it("should evaluate a single incorrect answer", () => {
    const answers: PlayerAnswer[] = [
      { playerId: "bob", answer: "Germany", timestamp: 1000 }
    ];

    const scores = evaluateRound(answers, testCountry, 0);

    expect(scores).toHaveLength(1);
    expect(scores[0].playerId).toBe("bob");
    expect(scores[0].isCorrect).toBe(false);
    expect(scores[0].roundScore).toBe(0);
  });

  it("should handle multiple players with different answers", () => {
    const answers: PlayerAnswer[] = [
      { playerId: "alice", answer: "France", timestamp: 1200 }, // Correct, 1.2s
      { playerId: "bob", answer: "Germany", timestamp: 800 }, // Wrong, 0.8s
      { playerId: "carol", answer: "FR", timestamp: 500 } // Correct (alternate), 0.5s
    ];

    const scores = evaluateRound(answers, testCountry, 0);

    expect(scores).toHaveLength(3);

    // Alice: correct, 1200ms → 100 + (100 - 12) = 188
    expect(scores[0].playerId).toBe("alice");
    expect(scores[0].isCorrect).toBe(true);
    expect(scores[0].roundScore).toBe(188);

    // Bob: incorrect
    expect(scores[1].playerId).toBe("bob");
    expect(scores[1].isCorrect).toBe(false);
    expect(scores[1].roundScore).toBe(0);

    // Carol: correct, 500ms → 100 + (100 - 5) = 195
    expect(scores[2].playerId).toBe("carol");
    expect(scores[2].isCorrect).toBe(true);
    expect(scores[2].roundScore).toBe(195);
  });

  it("should calculate response time relative to round start", () => {
    const roundStartTime = 5000; // Round started at 5 seconds
    const answers: PlayerAnswer[] = [
      { playerId: "alice", answer: "France", timestamp: 6000 } // Answered at 6s → 1s response
    ];

    const scores = evaluateRound(answers, testCountry, roundStartTime);

    // Response time: 6000 - 5000 = 1000ms
    // Score: 100 + (100 - 10) = 190
    expect(scores[0].roundScore).toBe(190);
  });

  it("should accept alternate names", () => {
    const answers: PlayerAnswer[] = [
      { playerId: "p1", answer: "FR", timestamp: 0 },
      { playerId: "p2", answer: "French Republic", timestamp: 0 }
    ];

    const scores = evaluateRound(answers, testCountry, 0);

    expect(scores[0].isCorrect).toBe(true);
    expect(scores[1].isCorrect).toBe(true);
  });
});

// ============================================
// Test Suite 3: calculateLeaderboard Function
// ============================================
describe("calculateLeaderboard()", () => {
  it("should rank players by score (highest first)", () => {
    const players = new Map([
      ["alice", { name: "Alice", totalScore: 500 }],
      ["bob", { name: "Bob", totalScore: 300 }],
      ["carol", { name: "Carol", totalScore: 400 }]
    ]);

    const leaderboard = calculateLeaderboard(players);

    expect(leaderboard).toHaveLength(3);
    expect(leaderboard[0].playerId).toBe("alice");
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[1].playerId).toBe("carol");
    expect(leaderboard[1].rank).toBe(2);
    expect(leaderboard[2].playerId).toBe("bob");
    expect(leaderboard[2].rank).toBe(3);
  });

  it("should handle ties correctly (same rank, skip next)", () => {
    const players = new Map([
      ["alice", { name: "Alice", totalScore: 500 }],
      ["bob", { name: "Bob", totalScore: 500 }], // Tied with Alice
      ["carol", { name: "Carol", totalScore: 300 }]
    ]);

    const leaderboard = calculateLeaderboard(players);

    // Alice and Bob tied for 1st
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[1].rank).toBe(1);
    // Carol is 3rd (rank 2 is skipped)
    expect(leaderboard[2].rank).toBe(3);
    expect(leaderboard[2].totalScore).toBe(300);
  });

  it("should handle multiple ties", () => {
    const players = new Map([
      ["p1", { name: "Player 1", totalScore: 500 }],
      ["p2", { name: "Player 2", totalScore: 400 }],
      ["p3", { name: "Player 3", totalScore: 400 }],
      ["p4", { name: "Player 4", totalScore: 400 }],
      ["p5", { name: "Player 5", totalScore: 100 }]
    ]);

    const leaderboard = calculateLeaderboard(players);

    expect(leaderboard[0].rank).toBe(1); // 500 points
    expect(leaderboard[1].rank).toBe(2); // 400 points
    expect(leaderboard[2].rank).toBe(2); // 400 points (tied)
    expect(leaderboard[3].rank).toBe(2); // 400 points (tied)
    expect(leaderboard[4].rank).toBe(5); // 100 points (ranks 3-4 skipped)
  });

  it("should include all player information", () => {
    const players = new Map([["alice123", { name: "Alice", totalScore: 500 }]]);

    const leaderboard = calculateLeaderboard(players);

    expect(leaderboard[0]).toMatchObject({
      playerId: "alice123",
      playerName: "Alice",
      totalScore: 500,
      rank: 1
    });
  });

  it("should handle single player", () => {
    const players = new Map([
      ["solo", { name: "Solo Player", totalScore: 200 }]
    ]);

    const leaderboard = calculateLeaderboard(players);

    expect(leaderboard).toHaveLength(1);
    expect(leaderboard[0].rank).toBe(1);
  });

  it("should handle all players with same score", () => {
    const players = new Map([
      ["p1", { name: "Player 1", totalScore: 300 }],
      ["p2", { name: "Player 2", totalScore: 300 }],
      ["p3", { name: "Player 3", totalScore: 300 }]
    ]);

    const leaderboard = calculateLeaderboard(players);

    // All should be rank 1
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[1].rank).toBe(1);
    expect(leaderboard[2].rank).toBe(1);
  });
});

// ============================================
// Test Suite 4: Integration Test
// ============================================
describe("Integration: Complete Game Simulation", () => {
  it("should simulate a 3-round game", () => {
    const france: CountryFlags = {
      name: "France",
      emoji: "🇫🇷",
      alternate_names: ["FR"]
    };
    const germany: CountryFlags = {
      name: "Germany",
      emoji: "🇩🇪",
      alternate_names: ["DE"]
    };
    const japan: CountryFlags = {
      name: "Japan",
      emoji: "🇯🇵",
      alternate_names: ["JP"]
    };

    // Track player totals
    const playerScores = new Map([
      ["alice", { name: "Alice", totalScore: 0 }],
      ["bob", { name: "Bob", totalScore: 0 }]
    ]);

    // Round 1: France
    const round1: PlayerAnswer[] = [
      { playerId: "alice", answer: "France", timestamp: 1000 },
      { playerId: "bob", answer: "Germany", timestamp: 500 } // Wrong!
    ];
    const scores1 = evaluateRound(round1, france, 0);
    playerScores.get("alice")!.totalScore += scores1[0].roundScore;
    playerScores.get("bob")!.totalScore += scores1[1].roundScore;

    // Round 2: Germany
    const round2: PlayerAnswer[] = [
      { playerId: "alice", answer: "Germany", timestamp: 2000 },
      { playerId: "bob", answer: "DE", timestamp: 800 }
    ];
    const scores2 = evaluateRound(round2, germany, 0);
    playerScores.get("alice")!.totalScore += scores2[0].roundScore;
    playerScores.get("bob")!.totalScore += scores2[1].roundScore;

    // Round 3: Japan
    const round3: PlayerAnswer[] = [
      { playerId: "alice", answer: "Japan", timestamp: 1500 },
      { playerId: "bob", answer: "Japan", timestamp: 1200 }
    ];
    const scores3 = evaluateRound(round3, japan, 0);
    playerScores.get("alice")!.totalScore += scores3[0].roundScore;
    playerScores.get("bob")!.totalScore += scores3[1].roundScore;

    // Calculate final leaderboard
    const leaderboard = calculateLeaderboard(playerScores);

    expect(leaderboard).toHaveLength(2);
    expect(leaderboard[0].totalScore).toBeGreaterThan(0);
    expect(leaderboard[1].totalScore).toBeGreaterThan(0);

    // Both players should have ranks
    expect(leaderboard[0].rank).toBe(1);
    expect([1, 2]).toContain(leaderboard[1].rank);
  });
});
