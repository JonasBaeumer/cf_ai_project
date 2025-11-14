# 🌍 AI-Powered Multiplayer Country Guessing Game

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Project as part of the Cloudflare SWE Intern Application Process**

![Demo](https://private-user-images.githubusercontent.com/71970468/513462476-eac7a22d-e972-41d6-8d2c-d400ff015913.gif?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjMwMjUwMTQsIm5iZiI6MTc2MzAyNDcxNCwicGF0aCI6Ii83MTk3MDQ2OC81MTM0NjI0NzYtZWFjN2EyMmQtZTk3Mi00MWQ2LThkMmMtZDQwMGZmMDE1OTEzLmdpZj9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTExMTMlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUxMTEzVDA5MDUxNFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTQ3MjIyMWI1NTkyZDhlYWQ0YzQyN2UwY2Y4MjM5MjdlYTNmNjYxNTNiZmMyMDQ4MWY3MjE5NzYzNDVjYjI2ZGYmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.4JFJfYIVDCln2KAtn4kpIwSdFAwM5U2Iqh8lLCWddEs)

## 📖 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Development](#development)
- [Deployment](#deployment)
- [How It Works](#how-it-works)
- [Cloudflare Technologies Demonstrated](#cloudflare-technologies-demonstrated)
- [Future Enhancements](#future-enhancements)

## 🎯 Overview

This project is a **real-time multiplayer country guessing game** that combines the power of **Cloudflare AI Agents** with **Durable Objects** and **WebSocket Hibernation API** to create an interactive, scalable gaming experience. Players interact with an AI agent to create and join game lobbies, compete in timed rounds to identify countries by their flags, and see live leaderboards—all powered entirely by Cloudflare's edge computing platform.

### What Makes This Project Special

- **AI-Driven Game Flow**: An intelligent AI agent orchestrates the entire game experience, from lobby creation to result announcements
- **Real-Time Multiplayer**: WebSocket-based communication ensures instant updates across all connected players
- **Serverless Architecture**: Built on Cloudflare Workers and Durable Objects for global scalability and low latency
- **Hybrid UI Approach**: Combines agent chat interaction with real-time game event notifications in a dual-pane interface
- **State Management**: Leverages Durable Objects' persistent storage and the WebSocket Hibernation API for efficient resource usage

## 🚀 Getting Started

Choose one of the following options to start playing:

### Option 1: 🌐 Try the Live Demo (Quickest)

Play the game immediately at:

**🔗 [https://my-chat-agent.jbaeumer98.workers.dev](https://my-chat-agent.jbaeumer98.workers.dev)**

> ⚠️ **Important Notice**: This demo runs on my personal OpenAI API key. If the service experiences high traffic or excessive API usage, I may temporarily take it offline to manage costs. For uninterrupted access, please use Option 2 or 3 below.

**How to play:**
1. Open the link in your browser
2. Chat with the AI: "Create a game lobby"
3. Share the invitation code with friends
4. Start guessing flags! 🎯

---

### Option 2: 💻 Run Locally

Run the game on your local machine with full control.

**Prerequisites:**
- Node.js (v18 or later)
- npm (v9 or later)
- An OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

**Setup Steps:**

1. **Clone the repository**
   ```bash
   git clone https://github.com/JonasBaeumer/cf_ai_project.git
   cd cf_ai_project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.dev.vars` file in the project root:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
   
   Edit `.dev.vars` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key-here
   API_BASE_URL=http://localhost:5173
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:5173](http://localhost:5173) and start playing!

---

### Option 3: ☁️ Deploy Your Own Instance on Cloudflare

Deploy your own production-ready instance on Cloudflare Workers.

**Prerequisites:**
- Node.js (v18 or later)
- npm (v9 or later)
- A Cloudflare account ([Sign up for free](https://dash.cloudflare.com/sign-up))
- An OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

**Deployment Steps:**

1. **Clone and install** (if you haven't already)
   ```bash
   git clone https://github.com/JonasBaeumer/cf_ai_project.git
   cd cf_ai_project
   npm install
   ```

2. **Authenticate with Cloudflare**
   ```bash
   npx wrangler login
   ```
   This will open a browser window for authentication.

3. **Set up your workers.dev subdomain**
   
   Visit the [Cloudflare Workers dashboard](https://dash.cloudflare.com/workers-and-pages) and create your `workers.dev` subdomain (one-time setup).

4. **Update configuration**
   
   Edit `wrangler.jsonc` and update:
   ```jsonc
   {
     "name": "your-game-name",  // Change this
     "vars": {
       "API_BASE_URL": "https://your-game-name.your-subdomain.workers.dev"
     }
   }
   ```

5. **Set production secrets**
   ```bash
   npx wrangler secret put OPENAI_API_KEY
   ```
   Paste your OpenAI API key when prompted.

6. **Deploy to Cloudflare**
   ```bash
   npm run deploy
   ```

7. **Access your deployed game**
   
   Your game will be available at:
   ```
   https://your-game-name.your-subdomain.workers.dev
   ```

**Optional: Add a custom domain**

Edit `wrangler.jsonc`:
```jsonc
{
  "routes": [
    {
      "pattern": "yourdomain.com/*",
      "custom_domain": true
    }
  ]
}
```

Then redeploy with `npm run deploy`.

---

## ✨ Key Features

### 🤖 AI Agent Integration

- Natural language interaction for game management
- Contextual tool invocation with human-in-the-loop confirmation
- Intelligent game state tracking and progression
- Automated countdowns and result announcements

### 🎮 Multiplayer Game Mechanics

- **Lobby System**: Create private game rooms with unique invitation codes
- **Real-Time Synchronization**: All players see game events simultaneously via WebSockets
- **Timed Rounds**: 15-second rounds with automatic progression
- **Smart Scoring**: Points awarded based on correctness and response speed
- **Live Leaderboards**: Real-time ranking updates after each round

### 🔄 Real-Time Communication

- **WebSocket Hibernation API**: Efficient connection management that allows Durable Objects to hibernate when idle
- **Dual-Channel Updates**: Game events appear in both a dedicated sidebar and the main chat
- **Player Status Tracking**: Connection/disconnection notifications
- **Lobby Updates**: Automatic player list synchronization
- **Player-to-Player Chat**: Unified chat interface with toggle between AI Agent and Players mode
  - Persistent chat history stored in Durable Object
  - Real-time message broadcasting to all lobby members
  - Messages appear in Game Events sidebar
  - Automatic chat history loading for new players

### 🎨 Modern UI/UX

- **Dual-Pane Interface**: Separate chat and game events display
- **Dark/Light Theme**: Automatic theme switching based on system preferences
- **Responsive Design**: Optimized for desktop and mobile devices
- **Interactive Tool Cards**: Expandable/collapsible display of AI tool invocations
- **Real-Time Updates**: Smooth animations and instant feedback

## 🏗️ Architecture

The application follows a modern serverless architecture leveraging Cloudflare's edge computing platform:

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                           │
│  ┌─────────────────────┐        ┌─────────────────────────┐    │
│  │   Chat Interface    │        │  Game Events Sidebar    │    │
│  │  (AI Agent Chat)    │        │   (WebSocket Events)    │    │
│  └──────────┬──────────┘        └────────────┬────────────┘    │
│             │                                 │                  │
│             │ HTTP/SSE                        │ WebSocket        │
└─────────────┼─────────────────────────────────┼─────────────────┘
              │                                 │
              ▼                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE WORKERS                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Main Worker (server.ts)                      │  │
│  │  • Routes HTTP requests                                   │  │
│  │  • Handles API endpoints (/api/lobby/*)                   │  │
│  │  • Forwards requests to Durable Objects                   │  │
│  └───┬──────────────────────────────────────────┬───────────┘  │
│      │                                           │               │
│      │                                           │               │
│  ┌───▼───────────────────────┐      ┌──────────▼──────────┐    │
│  │  Chat Durable Object      │      │ GameLobby           │    │
│  │  (AI Agent Instance)      │      │ Durable Object      │    │
│  │                            │      │                     │    │
│  │  • Manages chat state     │      │ • Game state        │    │
│  │  • Processes AI messages  │      │ • Player mgmt       │    │
│  │  • Calls tools            │      │ • WebSocket conns   │    │
│  │  • Stores conversation    │      │ • Round logic       │    │
│  │    history in SQLite      │      │ • Score calculation │    │
│  └───────────┬───────────────┘      └──────────┬──────────┘    │
│              │                                  │                │
│              │ Tool Invocation                  │                │
│              └──────────────────────────────────┘                │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PERSISTENT STORAGE LAYER                     │  │
│  │  • Durable Object Storage: Game state, players, rounds   │  │
│  │  • SQLite (Chat DO): Conversation history, player IDs    │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                           │
│  • OpenAI API (GPT-4): AI chat responses                        │
│  • Cloudflare AI Gateway (optional): Caching & logging          │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Highlights

#### 1. **Chat Durable Object** (`Chat` class)

- **Purpose**: Manages AI agent conversations and tool execution
- **Persistence**: Uses SQLite to store chat history and player state
- **Responsibilities**:
  - Streaming AI responses via Server-Sent Events (SSE)
  - Tool invocation and confirmation workflow
  - Player ID generation and persistence
  - Message history management

#### 2. **GameLobby Durable Object** (`GameLobby` class)

- **Purpose**: Orchestrates multiplayer game sessions
- **Persistence**: Uses Durable Object storage for game state
- **Responsibilities**:
  - WebSocket connection management (via Hibernation API)
  - Player join/disconnect handling
  - Round timing and progression
  - Score calculation and leaderboard generation
  - Broadcasting game events to all connected players

#### 3. **WebSocket Hibernation API**

- Efficiently manages long-lived WebSocket connections
- Allows Durable Objects to be evicted from memory during inactivity
- Automatically wakes up the object when messages arrive
- Reduces costs and improves scalability

#### 4. **Tool System**

The AI agent exposes several tools that players can invoke through natural language:

```typescript
// Game Management Tools
- createGameLobby: Initialize a new game session
- joinGameLobby: Join an existing game with an invitation code
- startGame: Begin the game (host only)
- submitAnswer: Submit a guess for the current round
- getGameStatus: Check current game state and leaderboard
```

## 🛠️ Technology Stack

### Frontend

- **React 19.2**: Modern UI with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **React Markdown**: Markdown rendering for chat messages
- **AI SDK (Vercel)**: React hooks for AI chat integration

### Backend

- **Cloudflare Workers**: Serverless edge computing
- **Durable Objects**: Stateful coordination and storage
- **WebSocket Hibernation API**: Efficient real-time communication
- **TypeScript**: End-to-end type safety

### AI & Tools

- **Cloudflare Agents SDK** (`agents`): Framework for building AI agents
- **OpenAI GPT-4**: Natural language understanding
- **AI SDK** (`ai`): Unified AI interface with tool support
- **Zod**: Schema validation for tool parameters

### Development Tools

- **Wrangler**: Cloudflare Workers CLI
- **Biome**: Fast linting and formatting
- **Vitest**: Unit testing framework
- **Prettier**: Code formatting

## 📁 Project Structure

```
cf_ai_project/
├── src/
│   ├── server.ts                    # Main Worker & Chat Durable Object
│   ├── tools.ts                     # AI tool definitions (game actions)
│   ├── utils.ts                     # Helper functions
│   ├── shared.ts                    # Shared types
│   ├── client.tsx                   # React entry point
│   ├── app.tsx                      # Main React application
│   ├── styles.css                   # Global styles
│   │
│   ├── durable_objects/
│   │   └── GameLobby.ts            # Game session Durable Object
│   │
│   ├── components/                  # React components
│   │   ├── game/
│   │   │   ├── LobbyCard.tsx       # Game lobby UI
│   │   │   └── GameCard.tsx        # Active game UI
│   │   ├── game-events/
│   │   │   └── GameEventsSidebar.tsx  # Real-time events display
│   │   ├── tool-invocation-card/
│   │   │   └── ToolInvocationCard.tsx # Tool call UI
│   │   └── [other UI components]
│   │
│   ├── hooks/
│   │   ├── useGameLobby.tsx        # WebSocket game connection
│   │   ├── useTheme.ts             # Theme management
│   │   └── [other hooks]
│   │
│   ├── contexts/
│   │   └── AgentContext.tsx        # Agent communication context
│   │
│   ├── lib/
│   │   ├── flags.ts                # Country flag data
│   │   ├── game-logic.ts           # Scoring and evaluation
│   │   └── utils.ts                # Utility functions
│   │
│   └── types/
│       └── messages.ts             # Message type definitions
│
├── tests/
│   └── index.test.ts               # Test suite
│
├── public/                          # Static assets
│   └── favicon.ico
│
├── wrangler.jsonc                   # Cloudflare Workers config
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies and scripts
└── .dev.vars.example               # Environment variables template
```

## 🧪 Development & Testing

### Running Tests

```bash
npm test
```

This runs the Vitest test suite with Cloudflare Workers-specific configuration.

### Code Quality Checks

```bash
# Run linting and type checking
npm run check

# Format code
npm run format
```

### Debugging Tips

1. **Check Browser Console**: Game events and WebSocket messages are logged
2. **Wrangler Logs**: Terminal shows Durable Object logs (use `npx wrangler tail` for production)
3. **Network Tab**: Inspect WebSocket connections and HTTP requests
4. **React DevTools**: Install for component inspection

## 📊 Production Monitoring

If you've deployed your own instance (Option 3), you can monitor it using:

### Logs
```bash
npx wrangler tail
```
Stream real-time logs from your production worker.

### Analytics
View metrics in the [Cloudflare Dashboard](https://dash.cloudflare.com):
- **Workers → Analytics**: Request count, errors, CPU time
- **Durable Objects**: Active objects, storage usage

### Optional: AI Gateway

For request caching and logging, configure [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/):

```bash
npx wrangler secret put GATEWAY_BASE_URL
```

Then update your code to use the gateway URL as the OpenAI base URL.

## 🎮 How It Works

### Game Flow

```
1. Player Opens Application
   └─> Chat interface loads
   └─> AI agent ready to interact

2. Create Game Lobby
   └─> Player: "Create a game for me"
   └─> AI calls: createGameLobby tool
   └─> Returns: Invitation code (e.g., "GAME-A3F92B")
   └─> LobbyCard component renders
   └─> WebSocket connection established to GameLobby DO

3. Other Players Join
   └─> Player: "Join game GAME-A3F92B"
   └─> AI calls: joinGameLobby tool
   └─> Player added to lobby
   └─> WebSocket broadcasts: "player_joined" event
   └─> All players see updated player list

4. Host Starts Game
   └─> Player: "Start the game"
   └─> AI calls: startGame tool
   └─> GameLobby DO broadcasts countdown:
       • "🎮 Starting in 3..."
       • "🎮 Starting in 2..."
       • "🎮 Starting in 1..."
       • "Let's play! 🎯"

5. Round Begins
   └─> GameLobby DO:
       • Selects random country
       • Broadcasts flag emoji to all players
       • Starts 15-second timer
   └─> Players see flag in GameCard component

6. Players Submit Answers
   └─> Player: Types country name in input field
   └─> Frontend calls: /api/lobby/{code}/answer
   └─> GameLobby DO records answer with timestamp

7. Round Ends (after 15s or all answers submitted)
   └─> GameLobby DO:
       • Evaluates all answers
       • Calculates scores (correctness + speed bonus)
       • Updates player total scores
       • Broadcasts "round_result" event with:
         - Correct answer
         - Individual round scores
         - Updated leaderboard
   └─> 3-second delay
   └─> Next round starts (if more rounds remain)

8. Game Ends
   └─> After final round:
       • GameLobby DO calculates final leaderboard
       • Broadcasts "game_ended" event with winner
       • AI agent displays final results in chat
       • Game events sidebar shows complete history
```

### WebSocket Message Flow

```typescript
// Client → Server
{
  type: "answer",
  data: { answer: "France" }
}

// Server → Clients (Broadcast)
{
  type: "flag",
  data: {
    flagEmoji: "🇫🇷",
    roundNumber: 1,
    totalRounds: 3,
    startTime: 1699564800000
  }
}

{
  type: "round_result",
  data: {
    correctAnswer: "France",
    correctFlag: "🇫🇷",
    scores: [
      { playerId: "123", roundScore: 85, isCorrect: true }
    ],
    leaderboard: [
      { playerId: "123", name: "Player 1", totalScore: 85, rank: 1 }
    ]
  }
}

{
  type: "game_ended",
  data: {
    winner: { name: "Player 1", totalScore: 245 },
    leaderboard: [/* final standings */]
  }
}
```

## 🎓 Cloudflare Technologies Demonstrated

This project showcases several key Cloudflare technologies and best practices:

### 1. **Cloudflare Workers**

- ✅ Edge computing with TypeScript
- ✅ HTTP request routing and handling
- ✅ Integration with external APIs (OpenAI)
- ✅ Static asset serving via Workers Static Assets

### 2. **Durable Objects**

- ✅ Stateful coordination across multiple clients
- ✅ Persistent storage (KV-style and SQLite)
- ✅ Unique ID generation and routing
- ✅ Multiple Durable Object classes in one Worker

### 3. **WebSocket Hibernation API**

- ✅ Efficient WebSocket connection management
- ✅ Tagged WebSocket identification
- ✅ Broadcast messaging to multiple clients
- ✅ Automatic hibernation during inactivity
- ✅ Handler methods: `webSocketMessage`, `webSocketClose`, `webSocketError`

### 4. **Agents SDK**

- ✅ AI agent with tool integration
- ✅ Human-in-the-loop confirmations
- ✅ State persistence with SQLite
- ✅ Streaming responses via SSE
- ✅ Custom tool definitions with Zod schemas

### 5. **Best Practices**

- ✅ TypeScript for type safety
- ✅ Modular code organization
- ✅ Error handling and logging
- ✅ Efficient state management
- ✅ Security considerations (no secrets in code)
- ✅ Migration management for Durable Objects

## 🔮 Future Enhancements

Potential improvements and features to add:

### Gameplay

- [ ] Multiple difficulty levels (more countries, harder flags)
- [ ] Power-ups and bonuses
- [ ] Tournament mode with brackets
- [ ] Daily challenges and global leaderboards
- [ ] Different game modes (regions, capitals, languages)

### Technical

- [ ] Cloudflare D1 for persistent game history
- [ ] Cloudflare R2 for storing game replays
- [ ] Cloudflare Analytics Engine for game metrics
- [ ] Workers AI for multi-modal features (voice input)
- [ ] Hyperdrive for external database connections

### UI/UX

- [ ] Lobby chat between players
- [ ] Player avatars and customization
- [ ] Animated flag reveals
- [ ] Sound effects and music
- [ ] Mobile-optimized UI

### AI Agent

- [ ] Multi-language support
- [ ] Personalized hints and tips
- [ ] Game strategy coaching
- [ ] Adaptive difficulty based on player performance

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- Built with [Cloudflare Agents Starter Template](https://github.com/cloudflare/agents-starter)
- Powered by [Cloudflare Workers](https://workers.cloudflare.com/)
- AI by [OpenAI GPT-4](https://openai.com/)

---

<div align="center">
  <p><strong>Built for the Cloudflare SWE Internship Application</strong></p>
  <p>Demonstrating serverless architecture, real-time multiplayer, and AI agent integration</p>
</div>
