import type { CountryFlags } from "./flags";
import { isAnswerCorrect } from "./flags";

export interface PlayerAnswer {
  playerId: string;
  answer: string;
  timestamp: number;
}

export interface PlayerScore {
  playerId: string;
  roundScore: number;
  totalScore: number;
  isCorrect: boolean;
}

export interface RoundResult {
  roundNumber: number;
  correctAnswer: string;
  correctAnswerFlag: string;
  scores: PlayerScore[];
  fastestPlayer?: string;
}

export function calculateScore(
  isCorrect: boolean,
  responseTimeMs: number
): number {
  if (!isCorrect) {
    return 0;
  }
  const speedBonus = Math.max(0, 100 - responseTimeMs / 100);
  return 100 + speedBonus;
}

export function evaluateRound(
  answers: PlayerAnswer[],
  correctCountry: CountryFlags,
  roundStartTime: number
): PlayerScore[] {
  const scores: PlayerScore[] = [];
  // For each answer:
  // - Check if correct using isAnswerCorrect()
  for (const answer of answers) {
    const isCorrect = isAnswerCorrect(answer.answer, correctCountry);
    // - Calculate response time: timestamp - roundStartTime
    const responseTimeMs = answer.timestamp - roundStartTime;
    // - Calculate score using calculateScore()
    const score = calculateScore(isCorrect, responseTimeMs);
    scores.push({
      playerId: answer.playerId,
      roundScore: score,
      totalScore: score,
      isCorrect: isCorrect
    });
  }
  // - Return array of PlayerScore objects
  return scores;
}

export function calculateLeaderboard(
  players: Map<string, { name: string; totalScore: number }>
): Array<{
  playerId: string;
  playerName: string;
  totalScore: number;
  rank: number;
}> {
  // Convert Map to array of objects (not tuples)
  const playersArray = Array.from(players.entries()).map(
    ([playerId, data]) => ({
      playerId: playerId,
      playerName: data.name,
      totalScore: data.totalScore,
      rank: 0
    })
  );

  // Sort by totalScore (descending - highest first)
  playersArray.sort((a, b) => b.totalScore - a.totalScore);

  // Assign ranks with proper tie handling
  let currentRank = 1;
  for (let i = 0; i < playersArray.length; i++) {
    // If this is not the first player and score is same as previous
    if (
      i > 0 &&
      playersArray[i].totalScore === playersArray[i - 1].totalScore
    ) {
      // Same rank as previous player (tie!)
      playersArray[i].rank = playersArray[i - 1].rank;
    } else {
      // New rank = current position + 1
      playersArray[i].rank = currentRank;
    }
    // Increment current rank for next iteration
    currentRank++;
  }

  return playersArray;
}
