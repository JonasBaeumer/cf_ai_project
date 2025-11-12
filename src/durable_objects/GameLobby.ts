import { DurableObject } from "cloudflare:workers";
import type { CountryFlags } from "../lib/flags";
import { getRandomCountry } from "../lib/flags";
import { calculateLeaderboard, evaluateRound, type PlayerAnswer } from "../lib/game-logic";

// ============================================
// TYPES & INTERFACES
// ============================================

interface Player {
  id: string;
  name: string;
  connected: boolean;
  totalScore: number;
}

type GameStatus = 'waiting' | 'countdown' | 'playing' | 'round_ended' | 'finished';

interface CurrentRound {
  number: number;
  country: CountryFlags;
  startTime: number;
  answers: Map<string, PlayerAnswer>; // playerId -> their answer
}

interface GameState {
  status: GameStatus;
  currentRound: CurrentRound | null;
  totalRounds: number;
}

// WebSocket message types
interface WSMessage {
  type: string;
  data?: any;
}

// ============================================
// GAMELOBBY DURABLE OBJECT
// ============================================

export class GameLobby extends DurableObject {
  // Storage keys
  private readonly STORAGE_KEYS = {
    LOBBY_ID: 'lobbyId',
    INVITATION_CODE: 'invitationCode',
    HOST_ID: 'hostId',
    PLAYERS: 'players',
    GAME_STATE: 'gameState',
  };

  // In-memory state (not persisted)
  private players: Map<string, Player> = new Map();
  private webSockets: Map<string, WebSocket> = new Map(); // playerId -> WebSocket
  private gameState: GameState = {
    status: 'waiting',
    currentRound: null,
    totalRounds: 3,
  };
  private roundTimeoutId: ReturnType<typeof setTimeout> | null = null; // Track round timer

  /**
   * Constructor - called when DO is created or woken up
   */
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    
    // Load state from storage when DO wakes up
    this.ctx.blockConcurrencyWhile(async () => {
      await this.loadState();
    });
  }

  /**
   * Load persisted state from storage
   */
  private async loadState(): Promise<void> {
    // TODO: Load data from this.ctx.storage.get()
    // Hint: Use the STORAGE_KEYS
    // Load: players, gameState
    const playersData = await this.ctx.storage.get(this.STORAGE_KEYS.PLAYERS);
    if (playersData) {
      this.players = new Map(JSON.parse(playersData as string));
    }
    const gameStateData = await this.ctx.storage.get(this.STORAGE_KEYS.GAME_STATE);
    if (gameStateData) {
      this.gameState = JSON.parse(gameStateData as string);
    }
    
    console.log("GameLobby state loaded");
  }

  /**
   * Check if this lobby has been initialized
   */
  private async isInitialized(): Promise<boolean> {
    const lobbyId = await this.ctx.storage.get(this.STORAGE_KEYS.LOBBY_ID);
    return lobbyId !== undefined;
  }

  /**
   * Save state to persistent storage
   */
  private async saveState(): Promise<void> {
    // TODO: Save data to this.ctx.storage.put()
    // Convert Maps to arrays before storing (Maps can't be JSON.stringified directly)
    await this.ctx.storage.put(this.STORAGE_KEYS.PLAYERS, JSON.stringify(Array.from(this.players.entries())));
    await this.ctx.storage.put(this.STORAGE_KEYS.GAME_STATE, JSON.stringify(this.gameState));

    console.log("GameLobby state saved");
  }

  /**
   * Initialize a new lobby
   */
  async initialize(hostId: string, hostName: string, invitationCode: string): Promise<void> {
    
    const lobbyId = crypto.randomUUID();

    await this.ctx.storage.put({
    [this.STORAGE_KEYS.LOBBY_ID]: lobbyId,
    [this.STORAGE_KEYS.INVITATION_CODE]: invitationCode,
    [this.STORAGE_KEYS.HOST_ID]: hostId,
    })
    
    this.players.set(hostId, { id: hostId, name: hostName, connected: false, totalScore: 0 });
    
    await this.saveState();
    
    console.log(`Lobby initialized with code: ${invitationCode}`);
  }

  /**
   * Main fetch handler - handles HTTP requests and WebSocket upgrades
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle WebSocket upgrade requests
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocketUpgrade(request);
    }

    // Handle HTTP API requests
    const path = url.pathname;

    // POST /initialize - Set up a new lobby
    if (path === "/initialize" && request.method === "POST") {
      const { hostId, hostName, invitationCode } = await request.json() as { hostId: string, hostName: string, invitationCode: string };
      await this.initialize(hostId, hostName, invitationCode);
      return Response.json({ success: true });
    }

    // POST /join - Add a player to the lobby
    if (path === "/join" && request.method === "POST") {
      const { playerId, playerName } = await request.json() as { playerId: string, playerName: string };
      await this.addPlayer(playerId, playerName);
      return Response.json({ success: true, players: Array.from(this.players.values()) });
    }

    // POST /start - Start the game (host only)
    if (path === "/start" && request.method === "POST") {
      await this.startGame();
      return Response.json({ success: true });
    }

    // POST /answer - Submit an answer
    if (path === "/answer" && request.method === "POST") {
      const { playerId, answer } = await request.json() as { playerId: string, answer: string };
      await this.handlePlayerAnswer(playerId, answer);
      return Response.json({ success: true });
    }

    // GET /status - Get current lobby status
    if (path === "/status" && request.method === "GET") {
      // Check if lobby exists
      if (!(await this.isInitialized())) {
        return Response.json({ error: "Lobby not found" }, { status: 404 });
      }
      
      return Response.json({
        players: Array.from(this.players.values()),
        gameState: this.gameState,
      });
    }

    return new Response("Not found", { status: 404 });
  }

  /**
   * Handle WebSocket upgrade and connection
   */
  private async handleWebSocketUpgrade(request: Request): Promise<Response> {
    
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    
    // Extract playerId from URL query params
    const url = new URL(request.url);
    const playerId = url.searchParams.get("playerId");
    
    if (!playerId) {
      return new Response("Missing playerId", { status: 400 });
    }
    
    this.ctx.acceptWebSocket(server, [playerId]);
    this.webSockets.set(playerId, server);
    
    // Mark player as connected
    const player = this.players.get(playerId);
    if (player) {
      player.connected = true;
    }
    await this.saveState();
    
    this.broadcast({ type: 'player_connected', data: { playerId } });

    return new Response(null, { status: 101, webSocket: client });
  }

  /**
   * Add a player to the lobby
   */
  private async addPlayer(playerId: string, playerName: string): Promise<void> {
    // 1. Create Player object
    const player: Player = {id: playerId, name: playerName, connected: false, totalScore: 0}
    // 2. Add to this.players Map
    this.players.set(playerId, player)
    // 3. Save state
    await this.saveState();
    // 4. Broadcast to all players that someone joined
    this.broadcast({type: 'player_joined', data: {playerId, playerName}})
    
    console.log(`Player ${playerName} (${playerId}) joined`);
  }

  /**
   * WebSocket message handler - called when a player sends a message
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      // Parse the message
      const data: WSMessage = JSON.parse(message as string);
      
      // Get playerId from WebSocket tags
      const tags = this.ctx.getTags(ws);
      const playerId = tags[0];

      if (!playerId) {
        console.error("WebSocket has no playerId tag");
        return;
      }

      console.log(`Received message from ${playerId}:`, data.type);

      // Handle different message types
      switch (data.type) {
        case 'answer':
          await this.handlePlayerAnswer(playerId, data.data.answer);
          break;
        
        case 'start':
          // Only host can start (you can add this check)
          await this.startGame();
          break;
        
        default:
          console.log(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
    }
  }

  /**
   * WebSocket close handler - called when a player disconnects
   */
  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    const tags = this.ctx.getTags(ws);
    const playerId = tags[0];

    if (playerId) {
      // TODO: Mark player as disconnected and remove their WebSocket
      // TASK 6: YOUR CODE HERE
      const player = this.players.get(playerId);
      if (player) {
        player.connected = false;
      }
      this.webSockets.delete(playerId);
      await this.saveState();
      this.broadcast({type: 'player_disconnected', data: {playerId}})
      
      console.log(`Player ${playerId} disconnected`);
    }
  }

  /**
   * WebSocket error handler
   */
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("WebSocket error:", error);
  }

  /**
   * Start the game
   */
  private async startGame(): Promise<void> {
    if (this.gameState.status !== 'waiting') {
      console.log("Game already started");
      return;
    }

    // Change status to countdown
    this.gameState.status = 'countdown';
    
    // Broadcast countdown messages to ALL players
    for (let i = 3; i > 0; i--) {
      this.broadcast({
        type: 'countdown', 
        data: { count: i, message: `🎮 Starting in ${i}...` }
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.broadcast({
      type: 'countdown', 
      data: { count: 0, message: "Let's play! 🎯" }
    });
    
    // Start the first round
    await this.startRound(1);
    
    console.log("Game started");
  }

  /**
   * Start a new round
   */
  private async startRound(roundNumber: number): Promise<void> {
    // 1. Get random country
    const country = getRandomCountry();
    // 2. Create CurrentRound object
    this.gameState.currentRound = {
      number: roundNumber, 
      country: country,
      startTime: Date.now(),
      answers: new Map(),
    }
    // 3. Update gameState.status to 'playing'
    this.gameState.status = 'playing';
    // 4. Broadcast flag to all players
    this.broadcast({type: 'flag', 
      data: {
        flagEmoji: country.emoji,
        roundNumber: roundNumber, 
        totalRounds: this.gameState.totalRounds,
        startTime: this.gameState.currentRound.startTime
      }
    })
    // 5. Set timeout to end round after 15 seconds - store ID so we can cancel it
    this.roundTimeoutId = setTimeout(() => this.endRound(), 15000);
    
    console.log(`Starting round ${roundNumber}`);
  }

  /**
   * Handle a player's answer
   */
  private async handlePlayerAnswer(playerId: string, answer: string): Promise<void> {
    if (!this.gameState.currentRound) {
      console.log("No active round");
      return;
    }

    // 1. Check if player already answered
    if (this.gameState.currentRound.answers.has(playerId)) {
      console.log(`Player ${playerId} already answered`);
      return;
    } 
    this.gameState.currentRound.answers.set(playerId, 
      {
        playerId: playerId, 
        answer: answer,
        timestamp: Date.now(),
      })
    await this.saveState();
     
    // 2. Record answer with timestamp
    // 3. Check if all players have answered, if yes end the round immediately
    if (this.gameState.currentRound.answers.size === this.players.size) {
      await this.endRound();
    }
    
    console.log(`Player ${playerId} answered: ${answer}`);
  }

  /**
   * End the current round and show results
   */
  private async endRound(): Promise<void> {
    if (!this.gameState.currentRound) return;

    // Guard: prevent multiple calls to endRound
    if (this.gameState.status === "round_ended" || this.gameState.status === "finished") {
      console.log("Round already ended or game finished");
      return;
    }
    
    // Clear the round timeout to prevent it from firing again
    if (this.roundTimeoutId) {
      clearTimeout(this.roundTimeoutId);
      this.roundTimeoutId = null;
    }
    
    this.gameState.status = 'round_ended';
    // 1. Collect all answers
    const answers = Array.from(this.gameState.currentRound.answers.values());
    // 2. Use evaluateRound() from game-logic.ts to score them
    const scores = evaluateRound(
      answers, 
      this.gameState.currentRound.country,
      this.gameState.currentRound.startTime
    );
    // 3. Update player totalScores
    for (const score of scores) {
      const player = this.players.get(score.playerId);
      if (player) {
        player.totalScore += score.roundScore;
      }
    }

    await this.saveState();
    // 4. Broadcast results to all players
    this.broadcast({type: 'round_result', 
      data: {
        correctAnswer: this.gameState.currentRound.country.name,
        correctFlag: this.gameState.currentRound.country.emoji,
        scores: scores,
        leaderboard: calculateLeaderboard(this.players)
      }
    })

    await new Promise(resolve => setTimeout(resolve, 3000));
    // 5. If more rounds, start next round
    if (this.gameState.currentRound.number < this.gameState.totalRounds) {
      await this.startRound(this.gameState.currentRound.number + 1);
    } else {
      await this.endGame();
    }
    
    console.log("Round ended");
  }

  /**
   * End the game and show final results
   */
  private async endGame(): Promise<void> {
    // Guard: prevent multiple calls to endGame
    if (this.gameState.status === 'finished') {
      console.log("Game already ended");
      return;
    }
    
    // 1. Update status to 'finished'
    this.gameState.status = 'finished'
    // 2. Calculate final leaderboard
    const leaderboard = calculateLeaderboard(this.players);
    // 3. Broadcast winner and final standings
    this.broadcast({type: 'game_ended', 
      data: {
        winner: leaderboard[0],
        leaderboard: leaderboard
      }
    })
    
    console.log("Game ended");
  }

  /**
   * Broadcast a message to all connected players
   */
  private broadcast(message: WSMessage): void {
    const payload = JSON.stringify(message);
    
    // TODO: Loop through this.webSockets and send to each
    for (const [playerId, ws] of this.webSockets.entries()) {
      try {
        ws.send(payload);
      } catch (error) {
        console.error(`Error sending message to ${playerId}:`, error);
      }
    }
    
    console.log(`Broadcasting: ${message.type}`);
  }

  /**
   * Send a message to a specific player
   */
  private sendToPlayer(playerId: string, message: WSMessage): void {
    const ws = this.webSockets.get(playerId);
    if (ws) {
      ws.send(JSON.stringify(message));
    }
  }
}

