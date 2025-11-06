import { useEffect, useRef, useState, useCallback } from 'react';
import { useAgentContext } from '@/contexts/AgentContext';

/**
 * Player in the lobby
 */
export interface LobbyPlayer {
  id: string;
  name: string;
  connected: boolean;
  totalScore: number;
}

/**
 * Game state status
 */
export type GameStatus = 'waiting' | 'countdown' | 'playing' | 'round_ended' | 'finished';

/**
 * Round result data
 */
export interface RoundResult {
  correctAnswer: string;
  correctFlag: string;
  scores: Array<{
    playerId: string;
    roundScore: number;
    totalScore: number;
    isCorrect: boolean;
  }>;
  leaderboard: Array<{
    playerId: string;
    playerName: string;
    totalScore: number;
    rank: number;
  }>;
}

/**
 * Game state
 */
export interface GameState {
  status: GameStatus;
  currentRound: {
    number: number;
    flagEmoji: string;
    totalRounds: number;
    startTime: number;
  } | null;
  roundResult: RoundResult | null;
  finalLeaderboard: Array<{
    playerId: string;
    playerName: string;
    totalScore: number;
    rank: number;
  }> | null;
}

/**
 * WebSocket message types from server
 */
interface WSMessage {
  type: string;
  data?: any;
}

/**
 * Hook to manage WebSocket connection to a game lobby
 * Handles real-time updates for players, game state, and events
 */
export function useGameLobby(invitationCode: string, playerId: string) {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    currentRound: null,
    roundResult: null,
    finalLeaderboard: null,
  });
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get agent context to send notifications
  const { sendMessage } = useAgentContext();

  /**
   * Send answer to the server
   */
  const sendAnswer = useCallback((answer: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'answer',
        data: { answer }
      }));
    }
  }, []);

  /**
   * Start the game (host only)
   */
  const startGame = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'start'
      }));
    }
  }, []);

  /**
   * Fetch current player list from API
   */
  const fetchPlayers = useCallback(async () => {
    try {
      const baseURL = window.location.origin;
      console.log(`Fetching players from: ${baseURL}/api/lobby/${invitationCode}/status`);
      const response = await fetch(`${baseURL}/api/lobby/${invitationCode}/status`);
      if (response.ok) {
        const data = await response.json() as { players: LobbyPlayer[], gameState: any };
        console.log('Fetched players:', data.players);
        console.log('Setting players state with length:', data.players.length);
        setPlayers(data.players);
        // Could also update gameState here if needed
      } else {
        console.error('Failed to fetch players:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Error fetching players:', err);
    }
  }, [invitationCode]);

  /**
   * Connect to the lobby WebSocket
   */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      // Determine WebSocket URL based on environment
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      
      // Get the lobby's WebSocket URL
      // Pattern: ws://localhost:5173/api/lobby/GAME-XXX/ws?playerId=xxx
      const wsUrl = `${protocol}//${host}/api/lobby/${invitationCode}/ws?playerId=${playerId}`;
      
      console.log(`Connecting to lobby WebSocket: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to lobby');
        setConnected(true);
        setError(null);
        // Fetch initial player list when connection opens
        fetchPlayers();
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          console.log('Received message:', message);

          switch (message.type) {
            case 'player_joined':
              // Fetch updated player list
              fetchPlayers();
              break;

            case 'player_connected':
              fetchPlayers();
              break;

            case 'player_disconnected':
              fetchPlayers();
              break;

            case 'game_starting':
            case 'countdown_started':
              setGameState(prev => ({
                ...prev,
                status: 'countdown',
              }));
              break;
            
            case 'countdown':
              // Server broadcasting countdown - send message WITH the text
              console.log(`⏱️ Countdown: ${message.data.message}`);
              sendMessage(message.data.message)
                .catch(err => console.error('Failed to send countdown:', err));
              break;

            case 'flag':
              // New round started
              setGameState(prev => ({
                ...prev,
                status: 'playing',
                currentRound: {
                  number: message.data.roundNumber,
                  flagEmoji: message.data.flagEmoji,
                  totalRounds: message.data.totalRounds,
                  startTime: message.data.startTime,
                },
                roundResult: null,
              }));
              
              // Send flag directly to agent with all data
              console.log(`🎮 Sending flag for round ${message.data.roundNumber}`);
              sendMessage(
                `🚩 **Round ${message.data.roundNumber}/${message.data.totalRounds}**\n\n` +
                `${message.data.flagEmoji}\n\n` +
                `Which country is this? You have 15 seconds! ⏱️`
              ).catch(err => console.error('Failed to send flag:', err));
              break;

            case 'round_result':
              // Round ended, show results
              setGameState(prev => ({
                ...prev,
                status: 'round_ended',
                roundResult: message.data,
              }));
              
              // Send results directly with all data
              console.log(`⏱️ Sending round results`);
              const leaderboard = message.data.leaderboard
                .map((p: any, i: number) => `${i + 1}. ${p.playerName}: ${p.totalScore} pts`)
                .join('\n');
              
              sendMessage(
                `⏱️ **Round Over!**\n\n` +
                `The correct answer was: **${message.data.correctAnswer}** ${message.data.correctFlag}\n\n` +
                `**Leaderboard:**\n${leaderboard}`
              ).catch(err => console.error('Failed to send results:', err));
              break;

            case 'game_ended':
              // Game finished
              setGameState(prev => ({
                ...prev,
                status: 'finished',
                finalLeaderboard: message.data.leaderboard,
              }));
              
              // Send final results with winner
              console.log(`🏆 Sending game end results`);
              const winner = message.data.winner;
              const finalBoard = message.data.leaderboard
                .map((p: any, i: number) => `${i + 1}. ${p.playerName}: ${p.totalScore} pts`)
                .join('\n');
              
              sendMessage(
                `🏆 **Game Over!**\n\n` +
                `🎉 **${winner.playerName}** wins with ${winner.totalScore} points!\n\n` +
                `**Final Standings:**\n${finalBoard}`
              ).catch(err => console.error('Failed to send game end:', err));
              break;
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
      };

      ws.onclose = () => {
        console.log('Disconnected from lobby');
        setConnected(false);
        wsRef.current = null;

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
        setError('Failed to connect');
    }
  }, [invitationCode, playerId, fetchPlayers, sendMessage]);

  /**
   * Connect on mount and cleanup on unmount
   */
  useEffect(() => {
    connect();
    fetchPlayers(); // Initial fetch

    return () => {
      // Cleanup: close WebSocket and cancel reconnect attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, fetchPlayers]);

  return {
    players,
    gameState,
    connected,
    error,
    sendAnswer,
    startGame,
  };
}

