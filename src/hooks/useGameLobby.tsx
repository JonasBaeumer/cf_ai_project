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
  const hasConnectedRef = useRef<boolean>(false); // Track if we've already initiated connection
  
  // Get agent context to display system messages
  const { addSystemMessage } = useAgentContext();

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
      const response = await fetch(`${baseURL}/api/lobby/${invitationCode}/status`);
      if (response.ok) {
        const data = await response.json() as { players: LobbyPlayer[], gameState: any };
        console.log(`[useGameLobby ${invitationCode.slice(-4)}] fetchPlayers: got ${data.players.length} players`);
        setPlayers(data.players);
      }
    } catch (err) {
      console.error('[useGameLobby] Error fetching players:', err);
    }
  }, [invitationCode]);

  /**
   * Connect to the lobby WebSocket
   */
  const connect = useCallback(() => {
    // Prevent multiple simultaneous connections
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('[useGameLobby] Already connected/connecting, skipping');
      return;
    }

    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/lobby/${invitationCode}/ws?playerId=${playerId}`;
      
      console.log(`[useGameLobby] Connecting to ${invitationCode}...`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[useGameLobby] ✓ Connected to ${invitationCode} at ${timestamp}`);
        console.log(`[useGameLobby] WebSocket readyState:`, ws.readyState, '(1 = OPEN)');
        setConnected(true);
        setError(null);
        // Fetch initial player list when connection opens
        fetchPlayers();
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          console.log(`[useGameLobby ${invitationCode.slice(-4)}] WS message:`, message.type);

          switch (message.type) {
            case 'player_joined':
            case 'player_connected':
            case 'player_disconnected':
              // Only fetch players on actual player changes
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
              // Server broadcasting countdown - display as system message
              console.log(`[useGameLobby ${invitationCode.slice(-4)}] → addSystemMessage (countdown):`, message.data.message);
              addSystemMessage(message.data.message);
              break;

            case 'flag':
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
              
              addSystemMessage(
                `🚩 **Round ${message.data.roundNumber}/${message.data.totalRounds}**\n\n` +
                `${message.data.flagEmoji}\n\n` +
                `Which country is this? You have 15 seconds! ⏱️`
              );
              break;

            case 'round_result':
              setGameState(prev => ({
                ...prev,
                status: 'round_ended',
                roundResult: message.data,
              }));
              
              const leaderboard = message.data.leaderboard
                .map((p: any, i: number) => `${i + 1}. ${p.playerName}: ${p.totalScore} pts`)
                .join('\n');
              
              addSystemMessage(
                `⏱️ **Round Over!**\n\n` +
                `The correct answer was: **${message.data.correctAnswer}** ${message.data.correctFlag}\n\n` +
                `**Leaderboard:**\n${leaderboard}`
              );
              break;

            case 'game_ended':
              setGameState(prev => ({
                ...prev,
                status: 'finished',
                finalLeaderboard: message.data.leaderboard,
              }));
              
              const winner = message.data.winner;
              const finalBoard = message.data.leaderboard
                .map((p: any, i: number) => `${i + 1}. ${p.playerName}: ${p.totalScore} pts`)
                .join('\n');
              
              addSystemMessage(
                `🏆 **Game Over!**\n\n` +
                `🎉 **${winner.playerName}** wins with ${winner.totalScore} points!\n\n` +
                `**Final Standings:**\n${finalBoard}`,
                { showInChat: true } // Show game results in main chat too!
              );
              break;
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[useGameLobby] WebSocket error:', event);
        setError('Connection error');
      };

      ws.onclose = (event) => {
        console.log(`[useGameLobby] Disconnected (code: ${event.code})`);
        setConnected(false);
        wsRef.current = null;

        // Only attempt to reconnect for abnormal closures
        if (event.code !== 1000 && event.code !== 1001) {
          console.log('[useGameLobby] Reconnecting in 3 seconds...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
        setError('Failed to connect');
    }
  }, [invitationCode, playerId, fetchPlayers, addSystemMessage]);

  /**
   * Connect on mount and cleanup on unmount
   * Only runs ONCE to prevent reconnection storms
   */
  useEffect(() => {
    // Prevent multiple connection attempts from React strict mode or re-renders
    if (hasConnectedRef.current) {
      console.log(`[useGameLobby ${invitationCode.slice(-4)}] Already initiated connection, skipping useEffect`);
      return;
    }
    
    hasConnectedRef.current = true;
    console.log(`[useGameLobby ${invitationCode.slice(-4)}] Initial connection setup for player ${playerId.slice(0, 8)}`);
    connect();
    fetchPlayers(); // Initial fetch

    return () => {
      // Cleanup: close WebSocket and cancel reconnect attempts
      console.log(`[useGameLobby ${invitationCode.slice(-4)}] Cleaning up connection`);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
      hasConnectedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitationCode, playerId]); // Only reconnect if lobby or player changes

  return {
    players,
    gameState,
    connected,
    error,
    sendAnswer,
    startGame,
  };
}

