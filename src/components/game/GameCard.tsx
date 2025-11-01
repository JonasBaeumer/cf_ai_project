import { useState, useEffect } from "react";
import { useGameLobby } from "@/hooks/useGameLobby";
import { Button } from "@/components/button/Button";
import { Input } from "@/components/input/Input";
import { Flag, Trophy, Clock } from "@phosphor-icons/react";

interface GameCardProps {
  lobbyCode: string;
  playerId: string;
  playerName: string;
}

export function GameCard({ lobbyCode, playerId, playerName }: GameCardProps) {
  const { gameState, sendAnswer } = useGameLobby(lobbyCode, playerId);
  const [answer, setAnswer] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15);

  // Timer countdown
  useEffect(() => {
    if (gameState.status === 'playing' && gameState.currentRound) {
      const startTime = gameState.currentRound.startTime;
      const duration = 15000; // 15 seconds

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
        setTimeRemaining(remaining);

        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [gameState.status, gameState.currentRound]);

  // Reset submission state when new round starts
  useEffect(() => {
    if (gameState.status === 'playing') {
      setHasSubmitted(false);
      setAnswer("");
    }
  }, [gameState.currentRound?.number]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim() && !hasSubmitted) {
      sendAnswer(answer.trim());
      setHasSubmitted(true);
    }
  };

  // Countdown state
  if (gameState.status === 'countdown') {
    return (
      <div className="p-8 text-center space-y-4">
        <Clock size={48} className="mx-auto text-[#F48120] animate-pulse" />
        <h2 className="text-2xl font-bold">Game Starting...</h2>
        <p className="text-muted-foreground">Get ready!</p>
      </div>
    );
  }

  // Playing state
  if (gameState.status === 'playing' && gameState.currentRound) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag size={20} className="text-[#F48120]" />
            <span className="font-medium">
              Round {gameState.currentRound.number} of {gameState.currentRound.totalRounds}
            </span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            timeRemaining <= 5 ? 'bg-red-500/20 text-red-500' : 'bg-background/80'
          }`}>
            <Clock size={16} />
            <span className="font-mono font-bold">{timeRemaining}s</span>
          </div>
        </div>

        {/* Flag Display */}
        <div className="bg-background/80 p-8 rounded-lg text-center">
          <div className="text-8xl mb-4">{gameState.currentRound.flagEmoji}</div>
          <p className="text-lg font-medium">Which country is this?</p>
        </div>

        {/* Answer Input */}
        {!hasSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="text"
              placeholder="Type country name..."
              initialValue={answer}
              onValueChange={(value) => setAnswer(value)}
              autoFocus
              className="text-center text-lg"
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={!answer.trim()}
            >
              Submit Answer
            </Button>
          </form>        ) : (
          <div className="text-center p-6 bg-background/80 rounded-lg">
            <p className="text-lg font-medium text-[#F48120]">✓ Answer Submitted!</p>
            <p className="text-sm text-muted-foreground mt-2">Waiting for other players...</p>
          </div>
        )}
      </div>
    );
  }

  // Round ended - show results
  if (gameState.status === 'round_ended' && gameState.roundResult) {
    const myScore = gameState.roundResult.scores.find(s => s.playerId === playerId);
    
    return (
      <div className="space-y-6">
        {/* Correct Answer */}
        <div className="text-center p-6 bg-background/80 rounded-lg">
          <div className="text-6xl mb-3">{gameState.roundResult.correctFlag}</div>
          <p className="text-xl font-bold">{gameState.roundResult.correctAnswer}</p>
        </div>

        {/* Your Score */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Your Score</p>
          <div className={`text-3xl font-bold ${myScore?.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
            {myScore?.isCorrect ? '✓' : '✗'} {myScore?.roundScore || 0} pts
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={18} className="text-[#F48120]" />
            <h4 className="font-semibold">Leaderboard</h4>
          </div>
          {gameState.roundResult.leaderboard.map((player, index) => (
            <div
              key={player.playerId}
              className={`flex items-center justify-between p-3 rounded-md ${
                player.playerId === playerId ? 'bg-[#F48120]/10 border border-[#F48120]/30' : 'bg-background/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg w-6">{player.rank}</span>
                <span className="font-medium">
                  {player.playerName}
                  {player.playerId === playerId && <span className="text-[#F48120] ml-2">(You)</span>}
                </span>
              </div>
              <span className="font-bold">{player.totalScore}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Next round starting soon...
        </p>
      </div>
    );
  }

  // Game finished
  if (gameState.status === 'finished' && gameState.finalLeaderboard) {
    const winner = gameState.finalLeaderboard[0];
    const isWinner = winner.playerId === playerId;

    return (
      <div className="space-y-6">
        {/* Winner Announcement */}
        <div className="text-center p-8 bg-gradient-to-b from-[#F48120]/20 to-transparent rounded-lg">
          <Trophy size={64} className="mx-auto mb-4 text-[#F48120]" />
          <h2 className="text-3xl font-bold mb-2">
            {isWinner ? '🎉 You Won!' : 'Game Over!'}
          </h2>
          <p className="text-xl">
            {isWinner ? 'Congratulations!' : `${winner.playerName} wins!`}
          </p>
        </div>

        {/* Final Standings */}
        <div className="space-y-2">
          <h4 className="font-semibold mb-3">Final Standings</h4>
          {gameState.finalLeaderboard.map((player, index) => (
            <div
              key={player.playerId}
              className={`flex items-center justify-between p-4 rounded-md ${
                player.playerId === playerId ? 'bg-[#F48120]/10 border border-[#F48120]/30' : 'bg-background/50'
              } ${index === 0 ? 'ring-2 ring-yellow-500' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${player.rank}.`}
                </span>
                <span className="font-medium">
                  {player.playerName}
                  {player.playerId === playerId && <span className="text-[#F48120] ml-2">(You)</span>}
                </span>
              </div>
              <span className="font-bold text-xl">{player.totalScore}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default/waiting state
  return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">Waiting for game to start...</p>
    </div>
  );
}
