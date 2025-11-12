# Phase 2 Test Plan: System Message Integration

## Overview
Phase 2 integrates system messages into the game flow, replacing the problematic `sendMessage` calls with `addSystemMessage` to prevent infinite loops and agent auto-responses.

## Changes Made

### 1. Updated `useGameLobby.tsx`
- **Line 86**: Changed `const { sendMessage }` to `const { addSystemMessage }`
- **Line 193**: Countdown - Now uses `addSystemMessage(message.data.message)`
- **Line 212**: Flag display - Now uses `addSystemMessage(...)`
- **Line 233**: Round results - Now uses `addSystemMessage(...)`
- **Line 255**: Game end - Now uses `addSystemMessage(...)`
- **Line 287**: Updated dependency array to include `addSystemMessage`

### 2. Key Improvements
✅ **No more infinite loops** - Agent doesn't see system messages as user input
✅ **No auto-responses** - Agent won't call tools in response to server notifications
✅ **Clear message origin** - `[SERVER]` badge distinguishes system messages
✅ **Proper message flow** - Server → Frontend → Display (no agent involvement)

---

## Manual Test Cases

### Test 1: Countdown Messages (ID: phase2-3)
**Steps:**
1. Start the development server: `npm start`
2. Open browser to `http://localhost:5173`
3. Tell agent: "Let's play guess the country game"
4. When prompted, say: "Call me Player1"
5. When lobby is created, tell agent: "Start the game"

**Expected Results:**
- ✅ See 4 system messages with `[SERVER]` badge:
  - "🎮 Starting in 3..."
  - "🎮 Starting in 2..."
  - "🎮 Starting in 1..."
  - "Let's play! 🎯"
- ❌ Agent should NOT respond to these messages
- ❌ No tool calls should be triggered
- ❌ No duplicate game instances

**Pass Criteria:**
- Countdown messages appear in chat
- Messages have `[SERVER]` badge
- Agent remains silent during countdown
- No console errors about tool calls

---

### Test 2: Flag Display (ID: phase2-4)
**Steps:**
1. Continue from Test 1 after countdown completes
2. Wait for flag to appear

**Expected Results:**
- ✅ See system message with `[SERVER]` badge:
  ```
  🚩 Round 1/3
  
  [FLAG EMOJI]
  
  Which country is this? You have 15 seconds! ⏱️
  ```
- ❌ Agent should NOT call `getGameStatus`
- ❌ Agent should NOT call `submitAnswer` automatically
- ✅ User can type answer normally

**Pass Criteria:**
- Flag appears as system message
- Message includes round number, flag emoji, and timer text
- Agent doesn't auto-respond
- User can submit answer by typing country name

---

### Test 3: Round Results (ID: phase2-5)
**Steps:**
1. Continue from Test 2
2. Submit an answer (correct or incorrect)
3. Wait for round to end (15 seconds or all players answered)

**Expected Results:**
- ✅ See system message with `[SERVER]` badge:
  ```
  ⏱️ Round Over!
  
  The correct answer was: [COUNTRY NAME] [FLAG]
  
  Leaderboard:
  1. Player1: [X] pts
  ```
- ❌ Agent should NOT respond or call tools
- ✅ If more rounds remain, next flag should appear

**Pass Criteria:**
- Results display with correct answer and flag
- Leaderboard shows all players and scores
- No agent interference
- Next round starts automatically (if not game end)

---

### Test 4: Game End (ID: phase2-6)
**Steps:**
1. Complete all 3 rounds
2. Wait for final results

**Expected Results:**
- ✅ See system message with `[SERVER]` badge:
  ```
  🏆 Game Over!
  
  🎉 [WINNER NAME] wins with [X] points!
  
  Final Standings:
  1. Player1: [X] pts
  2. Player2: [Y] pts
  ```
- ❌ Agent should NOT respond or call tools
- ✅ Lobby card should show final scores

**Pass Criteria:**
- Winner announcement displays correctly
- Final standings show all players
- No agent auto-responses
- Game state shows 'finished'

---

### Test 5: Multiplayer Scenario (ID: phase2-7)
**Steps:**
1. Open TWO browser windows/tabs (incognito for second)
2. Window 1: Create lobby as "Player1"
3. Copy invitation code
4. Window 2: Join lobby as "Player2" with code
5. Window 1: Start game
6. Both windows: Watch countdown and play

**Expected Results:**
- ✅ Both players see identical countdown messages simultaneously
- ✅ Both players see same flag at same time
- ✅ Both players see same results
- ❌ No duplicate countdowns
- ❌ No multiple game instances
- ❌ No WebSocket death spirals in console

**Pass Criteria:**
- Synchronized game flow across both windows
- No "Insufficient resources" errors
- No infinite reconnection loops
- Clean console logs (no errors)

---

## Debugging Tips

### Check Console Logs
Look for these messages to confirm correct flow:
```
✓ [useGameLobby] Hook initialized, sendMessage available: true
✓ Connecting to lobby WebSocket: ws://localhost:5173/api/lobby/...
✓ Connected to lobby
✓ ⏱️ Countdown: 🎮 Starting in 3...
✓ 🎮 Displaying flag for round 1
✓ ⏱️ Displaying round results
✓ 🏆 Displaying game end results
```

### Red Flags (Should NOT See)
```
❌ Failed to send countdown: ...
❌ ReferenceError: extraData is not defined
❌ WebSocket connection failed: Insufficient resources
❌ Error: Cannot find package '@testing-library/react'
❌ [Tool Call] getGameStatus
❌ [Tool Call] submitAnswer (unless user explicitly types answer)
```

---

## Success Criteria Summary

| Test | ID | Status | Critical |
|------|-----|--------|----------|
| Countdown Messages | phase2-3 | ⏳ | Yes |
| Flag Display | phase2-4 | ⏳ | Yes |
| Round Results | phase2-5 | ⏳ | Yes |
| Game End | phase2-6 | ⏳ | Yes |
| Multiplayer Sync | phase2-7 | ⏳ | Yes |

**Phase 2 Complete When:**
- All 5 tests pass ✅
- No infinite loops ✅
- No agent auto-responses to server messages ✅
- Clean console logs ✅

---

## Next Steps After Phase 2

If all tests pass, we move to **Phase 3**:
- Update agent system prompt to clarify server message handling
- Add user instructions for interacting with system messages
- Polish UI/UX for system message display
- Add optional features (message history, replay, etc.)

If tests fail, debug using:
1. Browser console logs
2. Network tab (WebSocket frames)
3. React DevTools (state inspection)
4. Wrangler logs (`wrangler dev --log-level debug`)

