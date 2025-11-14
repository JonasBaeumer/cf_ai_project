# 🤖 AI Assistant Prompts for Game Development

This document contains example prompts based on real development tasks from this project. Use these as templates when working with AI coding assistants on similar projects.

---

## 📋 Table of Contents

- [Code Skeleton Generation](#code-skeleton-generation)
- [Architecture Discussion](#architecture-discussion)
- [Bug Fixing](#bug-fixing)
- [Automatic Test Case Generation](#automatic-test-case-generation)
- [Deployment Support](#deployment-support)
- [Commit Message Generation](#commit-message-generation)
- [Feature Implementation](#feature-implementation)

---

## 🏗️ Code Skeleton Generation

### Creating a Game Lobby System

```
I'm building a multiplayer game using Cloudflare Durable Objects and WebSockets. 
Can you create a code skeleton for a GameLobby Durable Object that:

1. Manages multiple players in a lobby
2. Handles WebSocket connections using the Hibernation API
3. Stores game state (players, scores, current round)
4. Broadcasts messages to all connected players
5. Implements methods for: joining, starting game, submitting answers, ending rounds

Use TypeScript and follow Cloudflare's best practices for Durable Objects.
```

### Setting Up React Components

```
I need a React component structure for a multiplayer game interface. Create skeletons for:

1. LobbyCard - displays lobby info, player list, invitation code
2. GameCard - shows current round, flag to guess, input field, timer
3. GameEventsSidebar - displays real-time game events and updates

Use TypeScript, React hooks (useState, useEffect), and Tailwind CSS for styling.
Include props interfaces and basic component structure.
```

---

## 🏛️ Architecture Discussion

### Real-Time Multiplayer Architecture

```
I'm designing a real-time multiplayer country guessing game. The requirements are:

- AI agent orchestrates game flow via natural language
- Multiple players can join lobbies
- 15-second timed rounds with flags
- Real-time score updates
- Cross-platform compatibility

What architecture would you recommend using Cloudflare Workers? 
Should I use:
- Durable Objects for lobby state?
- WebSocket Hibernation API for connections?
- How should the AI agent communicate with game lobbies?

Please explain the data flow and why this architecture would work well.
```

### State Management Strategy

```
In my multiplayer game, I have two Durable Objects:
1. Chat (AI Agent) - handles user conversations and tool calls
2. GameLobby - manages game state and WebSocket connections

How should these communicate? Should Chat directly call GameLobby, or use HTTP APIs?
What's the best way to handle state synchronization between:
- The AI chat interface
- The game lobby UI component
- The backend Durable Objects

Suggest an architecture with clear data flow.
```

---

## 🐛 Bug Fixing

### WebSocket Connection Issues

```
I have a bug where player scores aren't updating after each round ends. Here's the issue:

1. Server sends "round_result" message via WebSocket
2. Message includes leaderboard with updated scores
3. Frontend receives the message but LobbyCard shows old scores

The useGameLobby hook sets players state from initial fetch but doesn't update 
it when round results arrive. Can you identify the problem and fix it?

Current code in useGameLobby.tsx:
[paste relevant code here]
```

### Cross-Platform Compatibility

```
Windows users report they can't see flag emojis (🇺🇸, 🇫🇷, etc.) in the game. 
The emojis work fine on Mac/Linux. 

Current implementation:
- Flags stored as emoji strings in our database
- Displayed directly in React components

How can I fix this to work across all platforms? Should I:
1. Use flag images instead?
2. If so, what's a reliable free CDN for flag images?
3. How do I map country codes to image URLs?

Provide a solution with code examples.
```

### Production Deployment Error

```
I'm getting this error when deploying to Cloudflare Workers:

"You need a workers.dev subdomain in order to proceed. Please go to the 
dashboard and open the Workers menu."

I've authenticated with wrangler and my config looks correct:
[paste wrangler.jsonc]

What am I missing? Walk me through the setup steps.
```

---

## 🧪 Automatic Test Case Generation

### Testing Game Logic

```
I have a game scoring function that needs test coverage:

export function calculateScore(
  isCorrect: boolean,
  responseTime: number,
  maxTime: number = 15000
): number {
  if (!isCorrect) return 0;
  const baseScore = 100;
  const speedBonus = Math.floor(((maxTime - responseTime) / maxTime) * 50);
  return baseScore + Math.max(0, speedBonus);
}

Generate comprehensive Vitest test cases that cover:
1. Correct answers with various response times
2. Incorrect answers
3. Edge cases (0ms, exactly maxTime, over maxTime)
4. Boundary conditions

Use descriptive test names and organize with describe blocks.
```

### Testing WebSocket Message Handling

```
I need tests for my WebSocket message handler in useGameLobby hook.
The handler processes different message types: "flag", "round_result", 
"game_ended", "player_joined", etc.

Generate test cases using Vitest that mock:
1. WebSocket messages
2. State updates
3. Callback functions

Focus on the "round_result" message handler which should:
- Update game state
- Update player scores
- Call addSystemMessage with formatted leaderboard
```

### Integration Tests for Durable Objects

```
Write integration tests for my GameLobby Durable Object using 
@cloudflare/vitest-pool-workers. Test scenarios:

1. Creating a lobby
2. Multiple players joining
3. Starting a game
4. Submitting answers
5. Round progression
6. Score calculation
7. Game ending

Use the Durable Object test helpers and ensure proper cleanup.
```

---

## 🚀 Deployment Support

### Local to Production Configuration

```
I'm deploying my Cloudflare Worker to production. Currently, my tools make 
fetch calls to localhost:5173. 

In my code:
const baseURL = process.env.API_BASE_URL || "http://localhost:5173";
const response = await fetch(`${baseURL}/api/lobby/create`, { ... });

How do I configure this properly for both local development and production?
Should I:
1. Use environment variables?
2. Set them in .dev.vars for local?
3. Set them in wrangler.jsonc for production?
4. Use Wrangler secrets?

Provide the complete setup.
```

### Setting Up Production Secrets

```
I need to deploy my worker that uses the OpenAI API. Walk me through:

1. How to securely store my API key in production
2. The difference between `vars` and `secrets` in wrangler.jsonc
3. Commands to set secrets via CLI
4. How to access them in my worker code
5. Best practices for managing multiple environments (dev, staging, prod)
```

### Custom Domain Setup

```
I've deployed my worker to workers.dev but want to use my custom domain.
Current URL: https://my-game.myname.workers.dev
Desired: https://game.mydomain.com

Walk me through:
1. DNS configuration
2. Wrangler.jsonc settings
3. SSL/TLS setup
4. Any gotchas or common issues
```

---

## 📝 Commit Message Generation

### Feature Addition

```
I've made the following changes to the codebase:

- Added 24 new countries to the flags list (from 6 to 30 total)
- Replaced flag emojis with images from flagcdn.com API
- Added country codes (ISO 3166-1 alpha-2) to the data structure
- Updated GameLobby to send country codes with flag messages
- Modified GameEventsSidebar to display flag images in a dedicated section
- Added comprehensive alternate names for each country

Generate a conventional commit message following best practices.
Format: feat/fix/docs followed by clear description and bullet points.
```

### Bug Fix

```
Create a commit message for these changes:

- Fixed player scores not updating after each round
- Added score synchronization in useGameLobby when "round_result" received
- Updated players state to reflect leaderboard scores
- Scores now update in real-time in the LobbyCard component

Follow conventional commits format.
```

### Documentation Update

```
I restructured the README with these changes:

- Moved setup instructions after Overview section
- Added three setup options: Live Demo, Local, Deploy Your Own
- Included warning about personal API key on live demo
- Consolidated duplicate sections
- Simplified production monitoring section
- Added direct link to deployed game
- Improved step-by-step instructions with code blocks

Generate an appropriate commit message.
```

---

## 🎨 Feature Implementation

### Adding Welcome Messages

```
I want to improve user onboarding by adding welcome messages:

1. When user first opens the chat, show a welcome card explaining the game
2. When a player connects via WebSocket to a lobby, send game instructions
3. Display the instructions in the Game Events sidebar

Requirements:
- Welcome card should list what the AI can help with
- Game instructions should explain rules, scoring, and round structure
- Messages should be well-formatted with emojis and markdown
- Should not interfere with existing message flow

Implement this across the relevant components (app.tsx, GameLobby.ts, etc).
```

### Implementing Leave Lobby Functionality

```
Players currently can't leave game lobbies. Implement a "Leave" button that:

1. Closes the WebSocket connection
2. Unregisters player chat functionality
3. Clears the lobby from the UI sidebar
4. Shows a confirmation message
5. Prevents auto-reconnection attempts
6. Cleans up all state properly

The button is already in LobbyCard.tsx but just logs to console.
Provide the complete implementation including:
- Hook function (useGameLobby)
- Context function (AgentContext)
- Component handler (LobbyCard)
```

### Sticky Lobby UI

```
I want the lobby card to stay visible while scrolling game events. Currently:

- Lobby card and game events are in the same scrollable container
- When events pile up, the lobby scrolls out of view
- Users lose track of players and scores

Implement a sticky layout where:
1. Lobby card stays fixed at the top
2. Game events scroll independently below it
3. Both remain visible simultaneously
4. Works with the 50/50 split layout

Use CSS position: sticky and proper z-indexing.
```

---

## 📚 Related Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)
- [WebSocket Hibernation API](https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Vitest Documentation](https://vitest.dev/)

---

*Generated from real development tasks in building an AI-powered multiplayer country guessing game on Cloudflare Workers.*

