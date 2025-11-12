/**
 * Tool definitions for the AI chat agent
 * Tools can either require human confirmation or execute automatically
 */
import { tool, type ToolSet } from "ai";
import { z } from "zod/v3";

import type { Chat } from "./server";
import { getCurrentAgent } from "agents";
import { scheduleSchema } from "agents/schedule";

/**
 * Get or create a persistent player ID for the current user
 * Stores the ID in the agent's state so it persists across tool calls
 */
async function getOrCreatePlayerId(): Promise<string> {
  const { agent } = getCurrentAgent<Chat>();
  
  // Try to get existing playerId from agent state
  const existingState = agent?.state as { playerId?: string } | undefined;
  
  if (existingState?.playerId) {
    console.log(`Using existing playerId: ${existingState.playerId}`);
    return existingState.playerId;
  }
  
  // Generate new playerId if none exists
  const newPlayerId = crypto.randomUUID();
  
  // Store it in agent state for future calls
  if (agent) {
    await agent.setState({
      ...existingState,
      playerId: newPlayerId
    });
  }
  
  console.log(`Created new playerId: ${newPlayerId}`);
  return newPlayerId;
}

/**
 * Weather information tool that requires human confirmation
 * When invoked, this will present a confirmation dialog to the user
 */
const getWeatherInformation = tool({
  description: "show the weather in a given city to the user",
  inputSchema: z.object({ city: z.string() })
  // Omitting execute function makes this tool require human confirmation
});

/**
 * Local time tool that executes automatically
 * Since it includes an execute function, it will run without user confirmation
 * This is suitable for low-risk operations that don't need oversight
 */
const getLocalTime = tool({
  description: "get the local time for a specified location",
  inputSchema: z.object({ location: z.string() }),
  execute: async ({ location }) => {
    console.log(`Getting local time for ${location}`);
    return "10am";
  }
});

const createGameLobby = tool({
  description: "Create a new game lobby for 'Guess the Country'. Returns an invitation code that other players can use to join.",
  inputSchema: z.object({
    playerName: z.string().describe("The name is the player creating the lobby")
  }),
  execute: async ({playerName}) => {
    try {
      const invitationCode = `GAME-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      const playerId = await getOrCreatePlayerId();
      
      // Get base URL from environment variable (set in .dev.vars for local development)
      const baseURL = process.env.API_BASE_URL || 'http://localhost:5173';
      
      const response = await fetch(`${baseURL}/api/lobby/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          hostId: playerId,
          hostName: playerName,
          invitationCode: invitationCode
        })
      });
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to create lobby: ${response.statusText}`
        };
      }
      const data = await response.json() as { invitationCode: string };
      return {
        success: true, 
        invitationCode: data.invitationCode,
        playerId: playerId,
        playerName: playerName
      };
    } catch (error) {
      console.error("Error creating lobby", error);
      return {
        success: false,
        error: `Failed to create lobby: ${error}`
      };
    }
  }
});

const joinGameLobby = tool({
  description: "Join an existing 'Guess the Country' game lobby using an invitation code.",
  inputSchema: z.object({
    playerName: z.string().describe("The name of the player joining the lobby"),
    invitationCode: z.string().describe("The invitation code of the lobby to join")
  }),
  execute: async ({playerName, invitationCode}) => {
    try {
      const playerId = await getOrCreatePlayerId();
      
      // Get base URL from environment variable (set in .dev.vars for local development)
      const baseURL = process.env.API_BASE_URL || 'http://localhost:5173';
      
      const response = await fetch(`${baseURL}/api/lobby/${invitationCode}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          playerId,
          playerName
        })
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to join lobby: ${response.statusText}`
        };
      }
      
      const data = await response.json() as { success: boolean, players: Array<{id: string, name: string}> };
      return {
        success: true,
        invitationCode: invitationCode,
        playerId: playerId,
        playerName: playerName,
        players: data.players
      };
    } catch (error) {
      console.error("Error joining lobby", error);
      return {
        success: false,
        error: `Failed to join lobby: ${error}`
      };
    }
  }
});

const startGame = tool({
  description: "Start the game in a 'Guess the Country' lobby. The server will handle the countdown and send flags automatically to all players. After calling this, the game begins immediately.",
  inputSchema: z.object({
    invitationCode: z.string().describe("The invitation code of the lobby to start the game"),
    playerName: z.string().describe("The name of the player starting the game")
  }),
  execute: async({invitationCode, playerName}) => {
    try {
      const playerId = await getOrCreatePlayerId();
      // Get base URL from environment variable (set in .dev.vars for local development)
      const baseURL = process.env.API_BASE_URL || 'http://localhost:5173';
      
      const response = await fetch(`${baseURL}/api/lobby/${invitationCode}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to start game: ${response.statusText}`
        };
      }
      return {
        success: true,
        invitationCode: invitationCode,
        playerId: playerId,
        playerName: playerName
      };
    } catch (error) {
      console.error("Error starting game", error);
      return {
        success: false,
        error: `Failed to start game: ${error}`
      };
    }
  }
});

const getGameStatus = tool({
  description: "Get the current status of a game lobby, including players, scores, and current round information. Only use this when the user explicitly asks for the game status or leaderboard. Do NOT call this automatically after starting a game - the server sends updates via the sidebar.",
  inputSchema: z.object({
    invitationCode: z.string().describe("The invitation code of the game lobby")
  }),
  execute: async({invitationCode}) => {
    try {
      const baseURL = process.env.API_BASE_URL || 'http://localhost:5173';
      const response = await fetch(`${baseURL}/api/lobby/${invitationCode}/status`);
      
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to get game status: ${response.statusText}`
        };
      }
      
      const data = await response.json() as {
        players: Array<{id: string, name: string, connected: boolean, totalScore: number}>,
        gameState: any
      };
      
      return {
        success: true,
        players: data.players,
        gameState: data.gameState
      };
    } catch (error) {
      console.error("Error getting game status", error);
      return {
        success: false,
        error: `Failed to get game status: ${error}`
      };
    }
  }
});

const submitAnswer = tool({
  description: "Submit a player's answer for the current round in a Guess the Country game. Call this ONLY when the user provides their answer. The round results will automatically appear in the sidebar when all players answer or the timer expires.",
  inputSchema: z.object({
    invitationCode: z.string().describe("The invitation code of the game lobby"),
    answer: z.string().describe("The player's answer (country name)")
  }),
  execute: async({invitationCode, answer}) => {
    try {
      const playerId = await getOrCreatePlayerId();
      const baseURL = process.env.API_BASE_URL || 'http://localhost:5173';
      
      const response = await fetch(`${baseURL}/api/lobby/${invitationCode}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          playerId,
          answer
        })
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to submit answer: ${response.statusText}`
        };
      }
      
      return {
        success: true,
        message: "Answer submitted! Waiting for other players..."
      };
    } catch (error) {
      console.error("Error submitting answer", error);
      return {
        success: false,
        error: `Failed to submit answer: ${error}`
      };
    }
  }
});

const scheduleTask = tool({
  description: "A tool to schedule a task to be executed at a later time",
  inputSchema: scheduleSchema,
  execute: async ({ when, description }) => {
    // we can now read the agent context from the ALS store
    const { agent } = getCurrentAgent<Chat>();

    function throwError(msg: string): string {
      throw new Error(msg);
    }
    if (when.type === "no-schedule") {
      return "Not a valid schedule input";
    }
    const input =
      when.type === "scheduled"
        ? when.date // scheduled
        : when.type === "delayed"
          ? when.delayInSeconds // delayed
          : when.type === "cron"
            ? when.cron // cron
            : throwError("not a valid schedule input");
    try {
      agent!.schedule(input!, "executeTask", description);
    } catch (error) {
      console.error("error scheduling task", error);
      return `Error scheduling task: ${error}`;
    }
    return `Task scheduled for type "${when.type}" : ${input}`;
  }
});

/**
 * Tool to list all scheduled tasks
 * This executes automatically without requiring human confirmation
 */
const getScheduledTasks = tool({
  description: "List all tasks that have been scheduled",
  inputSchema: z.object({}),
  execute: async () => {
    const { agent } = getCurrentAgent<Chat>();

    try {
      const tasks = agent!.getSchedules();
      if (!tasks || tasks.length === 0) {
        return "No scheduled tasks found.";
      }
      return tasks;
    } catch (error) {
      console.error("Error listing scheduled tasks", error);
      return `Error listing scheduled tasks: ${error}`;
    }
  }
});

/**
 * Tool to cancel a scheduled task by its ID
 * This executes automatically without requiring human confirmation
 */
const cancelScheduledTask = tool({
  description: "Cancel a scheduled task using its ID",
  inputSchema: z.object({
    taskId: z.string().describe("The ID of the task to cancel")
  }),
  execute: async ({ taskId }) => {
    const { agent } = getCurrentAgent<Chat>();
    try {
      await agent!.cancelSchedule(taskId);
      return `Task ${taskId} has been successfully canceled.`;
    } catch (error) {
      console.error("Error canceling scheduled task", error);
      return `Error canceling task ${taskId}: ${error}`;
    }
  }
});

/**
 * Export all available tools
 * These will be provided to the AI model to describe available capabilities
 */
export const tools = {
  getWeatherInformation,
  getLocalTime,
  createGameLobby,
  joinGameLobby,
  startGame,
  getGameStatus,
  submitAnswer,
  scheduleTask,
  getScheduledTasks,
  cancelScheduledTask
} satisfies ToolSet;

/**
 * Implementation of confirmation-required tools
 * This object contains the actual logic for tools that need human approval
 * Each function here corresponds to a tool above that doesn't have an execute function
 */
export const executions = {
  getWeatherInformation: async ({ city }: { city: string }) => {
    console.log(`Getting weather information for ${city}`);
    return `The weather in ${city} is sunny`;
  }
};
