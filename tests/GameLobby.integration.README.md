# GameLobby Integration Tests

## 🎯 Overview

These tests run against a **real deployed instance** of your GameLobby Durable Object. Unlike unit tests, these tests interact with the actual Cloudflare Workers runtime.

## 🚀 Quick Start

### **1. Start Your Worker**

**Option A: Local Development**

```bash
npm start
# Vite dev server starts at http://localhost:5173
# (If using raw wrangler dev, port will be 8787)
```

**Option B: Deploy to Cloudflare**

```bash
wrangler deploy
# Note your worker URL: https://your-worker.workers.dev
```

### **2. Run Tests**

**Against localhost:**

```bash
npm test GameLobby.integration
```

**Against deployed worker:**

```bash
WORKER_URL=https://your-worker.workers.dev npm test GameLobby.integration
```

---

## 📋 Test Coverage

### ✅ **What's Tested:**

| Category             | Tests | What It Checks                             |
| -------------------- | ----- | ------------------------------------------ |
| **Lobby Management** | 4     | Create, join, status, 404 handling         |
| **Game Flow**        | 2     | Start game, prevent double start           |
| **WebSocket**        | 1     | Connection handling (skipped by default)   |
| **Multi-Player**     | 1     | Multiple concurrent joins                  |
| **Error Handling**   | 2     | Invalid JSON, missing fields               |
| **Load Testing**     | 2     | Concurrent lobbies, many players (skipped) |

### ⚠️ **What's NOT Tested:**

- Full game rounds with timing (too complex for automated tests)
- WebSocket message flow (requires special setup)
- Actual flag guessing gameplay
- Leaderboard calculations in game context

**Why?** These are better tested **manually** or with **E2E tests** using a real browser.

---

## 🔧 Configuration

### **Environment Variables:**

```bash
# Worker URL (default: http://localhost:8787)
export WORKER_URL=https://your-worker.workers.dev

# Run tests
npm test GameLobby.integration
```

### **Test Timeouts:**

Most tests have 10-second timeouts. If your worker is slow or deployed far away, increase them:

```typescript
it("should create a new lobby", async () => {
  // test code
}, 20000); // 20 seconds instead of 10
```

---

## 🧪 Running Specific Tests

```bash
# Run all integration tests
npm test GameLobby.integration

# Run only lobby management tests
npm test -- -t "Lobby Management"

# Run only game flow tests
npm test -- -t "Game Flow"

# Run with verbose output
npm test GameLobby.integration -- --reporter=verbose

# Run in watch mode
npm test GameLobby.integration -- --watch
```

---

## 📊 Understanding Test Results

### **Success Output:**

```
✓ GameLobby Integration: Lobby Management > should create a new lobby (45ms)
✓ GameLobby Integration: Lobby Management > should allow players to join a lobby (123ms)
✓ GameLobby Integration: Game Flow > should start a game (3542ms)

Test Files  1 passed (1)
     Tests  8 passed (8)
```

### **Failure Output:**

```
✕ GameLobby Integration: Lobby Management > should create a new lobby (45ms)
  → expect(received).toBe(expected)

  Expected: 200
  Received: 404
```

**Common Failures:**

1. **404 errors**: Worker not running or wrong URL
2. **Timeouts**: Worker slow to respond (increase timeout)
3. **Connection refused**: Worker not started (`npm run dev`)
4. **CORS errors**: Need to add CORS headers to your worker

---

## 🐛 Troubleshooting

### **"Connection refused" Error:**

```
Error: connect ECONNREFUSED 127.0.0.1:8787
```

**Solution:** Start your worker first!

```bash
npm run dev
# In another terminal:
npm test GameLobby.integration
```

### **"404 Not Found" Error:**

```
Expected: 200
Received: 404
```

**Solution:** Your API routes might not be wired up yet. Check:

1. Is GameLobby bound in `wrangler.jsonc`?
2. Are routes defined in `src/server.ts`?
3. Is the worker actually deployed?

### **Tests Hang Forever:**

```
GameLobby Integration: Lobby Management > should create a new lobby
  (test never finishes)
```

**Solution:**

1. Check if worker is responding: `curl http://localhost:8787/api/lobby/TEST/status`
2. Increase timeout in test
3. Check worker logs for errors

### **"Invalid JSON" Errors:**

```
SyntaxError: Unexpected token < in JSON
```

**Solution:** Worker returned HTML instead of JSON. Check:

1. Are you hitting the right endpoint?
2. Did worker crash? Check logs: `wrangler tail`

---

## 🎯 What Each Test Does

### **Test: "should create a new lobby"**

```typescript
POST /api/lobby/create
Body: { hostId, hostName, invitationCode }

Expects:
- 200 status
- { success: true, lobbyId: "..." }
```

### **Test: "should allow players to join a lobby"**

```typescript
POST /api/lobby/{code}/join
Body: { playerId, playerName }

Expects:
- 200 status
- { success: true, players: [...] }
```

### **Test: "should return lobby status"**

```typescript
GET /api/lobby/{code}/status

Expects:
- 200 status
- { players: [...], gameState: {...} }
```

### **Test: "should start a game"**

```typescript
POST /api/lobby/{code}/start

Expects:
- 200 status
- Game state changes to 'countdown' or 'playing'
```

---

## 🔍 Manual Testing

Sometimes automated tests aren't enough. Here's how to test manually:

### **1. Create a Lobby:**

```bash
curl -X POST http://localhost:8787/api/lobby/create \
  -H "Content-Type: application/json" \
  -d '{
    "hostId": "host1",
    "hostName": "Alice",
    "invitationCode": "ABC123"
  }'
```

### **2. Join the Lobby:**

```bash
curl -X POST http://localhost:8787/api/lobby/ABC123/join \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player1",
    "playerName": "Bob"
  }'
```

### **3. Check Status:**

```bash
curl http://localhost:8787/api/lobby/ABC123/status
```

### **4. Start Game:**

```bash
curl -X POST http://localhost:8787/api/lobby/ABC123/start
```

### **5. Watch Logs:**

```bash
# Local dev
# Logs appear in terminal where you ran `npm run dev`

# Deployed worker
wrangler tail
```

---

## 📝 Adding New Tests

### **Template:**

```typescript
describe("GameLobby Integration: Your Feature", () => {
  it("should do something", async () => {
    // Arrange: Create test data
    const { lobbyCode } = await createLobby();

    // Act: Make request
    const response = await fetch(
      `${WORKER_URL}/api/lobby/${lobbyCode}/something`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: "test" })
      }
    );

    // Assert: Check response
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.result).toBe("expected");
  }, 10000); // Timeout in ms
});
```

---

## 🎓 Best Practices

1. **Always clean up**: Tests create real lobbies that persist
2. **Use unique IDs**: Prevents tests from interfering with each other
3. **Set appropriate timeouts**: Network calls are slow
4. **Test one thing**: Each test should verify one behavior
5. **Use descriptive names**: "should allow players to join" not "test2"
6. **Handle failures gracefully**: Tests might fail due to network issues

---

## 🚀 Next Steps

1. **Wire up your API routes** in `src/server.ts`
2. **Configure Durable Object bindings** in `wrangler.jsonc`
3. **Deploy your worker**: `wrangler deploy`
4. **Run these tests** to verify everything works!

---

## 📞 Need Help?

Common issues:

- Worker not responding → Check `npm run dev` is running
- 404 errors → Check API routes are configured
- Timeout errors → Increase timeout or check worker logs
- CORS errors → Add CORS headers to your worker responses

---

Good luck! 🎯
