import { describe, it, expect, beforeEach, beforeAll } from "vitest";

/**
 * Integration Tests for GameLobby Durable Object
 * 
 * These tests run against a REAL deployed (or local dev) instance.
 * 
 * Setup:
 * 1. Start local dev server: `npm run dev` (or deploy to Cloudflare)
 * 2. Set WORKER_URL environment variable (defaults to http://localhost:8787)
 * 3. Run tests: `npm test GameLobby.integration`
 * 
 * Note: These tests create real lobbies and WebSocket connections!
 */

// Get worker URL from environment or use localhost
const WORKER_URL = process.env.WORKER_URL || "http://localhost:8787";

// Helper to generate unique IDs
const generateId = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Helper to create lobby
async function createLobby(lobbyCode: string = generateId()) {
  const response = await fetch(`${WORKER_URL}/api/lobby/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hostId: generateId(),
      hostName: "TestHost",
      invitationCode: lobbyCode
    })
  });
  
  return { response, lobbyCode };
}

// ============================================
// TEST SUITE: Lobby Creation & Management
// ============================================

describe("GameLobby Integration: Lobby Management", () => {
  it("should create a new lobby", async () => {
    const { response, lobbyCode } = await createLobby();
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.lobbyId).toBeDefined();
  }, 10000);

  it("should allow players to join a lobby", async () => {
    const { lobbyCode } = await createLobby();
    
    // Join the lobby
    const response = await fetch(`${WORKER_URL}/api/lobby/${lobbyCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: generateId(),
        playerName: "Player1"
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.players).toBeDefined();
    expect(data.players.length).toBeGreaterThan(0);
  }, 10000);

  it("should return lobby status", async () => {
    const { lobbyCode } = await createLobby();
    
    // Get status
    const response = await fetch(`${WORKER_URL}/api/lobby/${lobbyCode}/status`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.players).toBeDefined();
    expect(data.gameState).toBeDefined();
    expect(data.gameState.status).toBe("waiting");
  }, 10000);

  it("should return 404 for non-existent lobby", async () => {
    const response = await fetch(`${WORKER_URL}/api/lobby/NONEXISTENT/status`);
    
    expect(response.status).toBe(404);
  }, 10000);
});

// ============================================
// TEST SUITE: Game Flow
// ============================================

describe("GameLobby Integration: Game Flow", () => {
  let lobbyCode: string;

  beforeEach(async () => {
    // Create a fresh lobby for each test
    const result = await createLobby();
    lobbyCode = result.lobbyCode;
  });

  it("should start a game", async () => {
    // Start the game
    const response = await fetch(`${WORKER_URL}/api/lobby/${lobbyCode}/start`, {
      method: "POST"
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    
    // Wait a bit for countdown
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check status
    const statusResponse = await fetch(`${WORKER_URL}/api/lobby/${lobbyCode}/status`);
    const status = await statusResponse.json();
    
    // Status should be 'countdown' or 'playing' depending on timing
    expect(['countdown', 'playing']).toContain(status.gameState.status);
  }, 15000);

  it("should prevent starting game twice", async () => {
    // Start game first time
    await fetch(`${WORKER_URL}/api/lobby/${lobbyCode}/start`, {
      method: "POST"
    });
    
    // Try to start again
    const response = await fetch(`${WORKER_URL}/api/lobby/${lobbyCode}/start`, {
      method: "POST"
    });
    
    // Should still return 200 (guard clause prevents double start)
    expect(response.status).toBe(200);
  }, 15000);
});

// ============================================
// TEST SUITE: WebSocket Connections
// ============================================

describe("GameLobby Integration: WebSocket", () => {
  // Note: WebSocket testing in Node.js requires 'ws' package
  // Skip these tests if not in a WebSocket-capable environment
  
  it.skip("should accept WebSocket connections", async () => {
    const { lobbyCode } = await createLobby();
    const playerId = generateId();
    
    // This would require 'ws' package and more complex setup
    // Example:
    // const WebSocket = require('ws');
    // const ws = new WebSocket(`ws://localhost:8787/api/lobby/${lobbyCode}/ws?playerId=${playerId}`);
    // 
    // await new Promise((resolve, reject) => {
    //   ws.on('open', () => {
    //     expect(ws.readyState).toBe(WebSocket.OPEN);
    //     ws.close();
    //     resolve();
    //   });
    //   ws.on('error', reject);
    // });
  });
});

// ============================================
// TEST SUITE: Multi-Player Scenarios
// ============================================

describe("GameLobby Integration: Multi-Player", () => {
  it("should handle multiple players joining", async () => {
    const { lobbyCode } = await createLobby();
    
    // Add multiple players
    const player1 = fetch(`${WORKER_URL}/api/lobby/${lobbyCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: generateId(),
        playerName: "Alice"
      })
    });
    
    const player2 = fetch(`${WORKER_URL}/api/lobby/${lobbyCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: generateId(),
        playerName: "Bob"
      })
    });
    
    const player3 = fetch(`${WORKER_URL}/api/lobby/${lobbyCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: generateId(),
        playerName: "Carol"
      })
    });
    
    // Wait for all to join
    const responses = await Promise.all([player1, player2, player3]);
    
    // All should succeed
    expect(responses.every(r => r.status === 200)).toBe(true);
    
    // Check final status
    const statusResponse = await fetch(`${WORKER_URL}/api/lobby/${lobbyCode}/status`);
    const status = await statusResponse.json();
    
    expect(status.players.length).toBe(4); // Host + 3 players
  }, 10000);
});

// ============================================
// TEST SUITE: Error Handling
// ============================================

describe("GameLobby Integration: Error Handling", () => {
  it("should handle invalid JSON gracefully", async () => {
    const response = await fetch(`${WORKER_URL}/api/lobby/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid json{"
    });
    
    // Should return error (400 or 500)
    expect([400, 500]).toContain(response.status);
  }, 10000);

  it("should handle missing required fields", async () => {
    const response = await fetch(`${WORKER_URL}/api/lobby/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Missing required fields
        hostName: "Test"
      })
    });
    
    // Should return error
    expect([400, 500]).toContain(response.status);
  }, 10000);
});

// ============================================
// TEST SUITE: Load Testing (Optional)
// ============================================

describe.skip("GameLobby Integration: Load Testing", () => {
  it("should handle many concurrent lobby creations", async () => {
    const promises = Array.from({ length: 10 }, () => createLobby());
    
    const results = await Promise.all(promises);
    
    // All should succeed
    expect(results.every(r => r.response.status === 200)).toBe(true);
  }, 30000);

  it("should handle many players in one lobby", async () => {
    const { lobbyCode } = await createLobby();
    
    // Add 50 players
    const promises = Array.from({ length: 50 }, (_, i) =>
      fetch(`${WORKER_URL}/api/lobby/${lobbyCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: generateId(),
          playerName: `Player${i}`
        })
      })
    );
    
    const responses = await Promise.all(promises);
    
    // Most should succeed (some might timeout)
    const successCount = responses.filter(r => r.status === 200).length;
    expect(successCount).toBeGreaterThan(40);
  }, 60000);
});

