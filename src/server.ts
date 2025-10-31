import { routeAgentRequest, type Schedule } from "agents";

import { getSchedulePrompt } from "agents/schedule";

import { AIChatAgent } from "agents/ai-chat-agent";
import {
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  stepCountIs,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  type ToolSet
} from "ai";
import { openai } from "@ai-sdk/openai";
import { processToolCalls, cleanupMessages } from "./utils";
import { tools, executions } from "./tools";
// import { env } from "cloudflare:workers";

// Export Durable Objects so Wrangler can find them
export { GameLobby } from "./durable_objects/GameLobby";

const model = openai("gpt-4o-2024-11-20");
// Cloudflare AI Gateway
// const openai = createOpenAI({
//   apiKey: env.OPENAI_API_KEY,
//   baseURL: env.GATEWAY_BASE_URL,
// });

/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env> {
  /**
   * Handles incoming chat messages and manages the response stream
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    _options?: { abortSignal?: AbortSignal }
  ) {
    // const mcpConnection = await this.mcp.connect(
    //   "https://path-to-mcp-server/sse"
    // );

    // Collect all tools, including MCP tools
    const allTools = {
      ...tools,
      ...this.mcp.getAITools()
    };

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Clean up incomplete tool calls to prevent API errors
        const cleanedMessages = cleanupMessages(this.messages);

        // Process any pending tool calls from previous messages
        // This handles human-in-the-loop confirmations for tools
        const processedMessages = await processToolCalls({
          messages: cleanedMessages,
          dataStream: writer,
          tools: allTools,
          executions
        });

        const result = streamText({
          system: `You are a helpful assistant that can do various tasks... 

${getSchedulePrompt({ date: new Date() })}

If the user asks to schedule a task, use the schedule tool to schedule the task.
`,

          messages: convertToModelMessages(processedMessages),
          model,
          tools: allTools,
          // Type boundary: streamText expects specific tool types, but base class uses ToolSet
          // This is safe because our tools satisfy ToolSet interface (verified by 'satisfies' in tools.ts)
          onFinish: onFinish as unknown as StreamTextOnFinishCallback<
            typeof allTools
          >,
          stopWhen: stepCountIs(10)
        });

        writer.merge(result.toUIMessageStream());
      }
    });

    return createUIMessageStreamResponse({ stream });
  }
  async executeTask(description: string, _task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        parts: [
          {
            type: "text",
            text: `Running scheduled task: ${description}`
          }
        ],
        metadata: {
          createdAt: new Date()
        }
      }
    ]);
  }
}

/**
 * Helper function to get GameLobby Durable Object by invitation code
 * Uses the invitation code as the DO name for easy lookup
 */
function getLobbyByCode(env: Env, invitationCode: string) {
  const id = env.GameLobby.idFromName(invitationCode);
  return env.GameLobby.get(id);
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    const url = new URL(request.url);

    // ==============================================
    // GAME LOBBY API ROUTES
    // ==============================================

    // POST /api/lobby/create - Create a new lobby
    if (url.pathname === "/api/lobby/create" && request.method === "POST") {
      try {
        const { hostId, hostName, invitationCode } = await request.json() as {
          hostId: string;
          hostName: string;
          invitationCode: string;
        };

        // Get or create DO instance using invitation code as name
        const lobby = getLobbyByCode(env, invitationCode);

        // Initialize the lobby
        await lobby.fetch(new Request(`${url.origin}/initialize`, {
          method: "POST",
          body: JSON.stringify({ hostId, hostName, invitationCode })
        }));

        return Response.json({
          success: true,
          lobbyId: invitationCode,
          invitationCode: invitationCode
        });
      } catch (error) {
        console.error("Error creating lobby:", error);
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
      }
    }

    // POST /api/lobby/:code/join - Join a lobby
    if (url.pathname.match(/^\/api\/lobby\/([^/]+)\/join$/) && request.method === "POST") {
      try {
        const code = url.pathname.split("/")[3];
        const { playerId, playerName } = await request.json() as {
          playerId: string;
          playerName: string;
        };

        const lobby = getLobbyByCode(env, code);

        const response = await lobby.fetch(new Request(`${url.origin}/join`, {
          method: "POST",
          body: JSON.stringify({ playerId, playerName })
        }));

        return response;
      } catch (error) {
        console.error("Error joining lobby:", error);
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
      }
    }

    // POST /api/lobby/:code/start - Start a game
    if (url.pathname.match(/^\/api\/lobby\/([^/]+)\/start$/) && request.method === "POST") {
      try {
        const code = url.pathname.split("/")[3];
        const lobby = getLobbyByCode(env, code);

        const response = await lobby.fetch(new Request(`${url.origin}/start`, {
          method: "POST"
        }));

        return response;
      } catch (error) {
        console.error("Error starting game:", error);
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
      }
    }

    // GET /api/lobby/:code/status - Get lobby status
    if (url.pathname.match(/^\/api\/lobby\/([^/]+)\/status$/) && request.method === "GET") {
      try {
        const code = url.pathname.split("/")[3];
        const lobby = getLobbyByCode(env, code);

        const response = await lobby.fetch(new Request(`${url.origin}/status`, {
          method: "GET"
        }));

        return response;
      } catch (error) {
        console.error("Error getting lobby status:", error);
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 404 });
      }
    }

    // GET /api/lobby/:code/ws - WebSocket connection
    if (url.pathname.match(/^\/api\/lobby\/([^/]+)\/ws$/) && request.headers.get("Upgrade") === "websocket") {
      try {
        const code = url.pathname.split("/")[3];
        const playerId = url.searchParams.get("playerId");

        if (!playerId) {
          return new Response("Missing playerId parameter", { status: 400 });
        }

        const lobby = getLobbyByCode(env, code);

        // Forward WebSocket upgrade request to the Durable Object
        return await lobby.fetch(new Request(`${url.origin}/ws?playerId=${playerId}`, {
          headers: request.headers
        }));
      } catch (error) {
        console.error("Error connecting WebSocket:", error);
        return new Response("WebSocket connection failed", { status: 500 });
      }
    }

    // ==============================================
    // EXISTING ROUTES
    // ==============================================

    if (url.pathname === "/check-open-ai-key") {
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
      return Response.json({
        success: hasOpenAIKey
      });
    }
    if (!process.env.OPENAI_API_KEY) {
      console.error(
        "OPENAI_API_KEY is not set, don't forget to set it locally in .dev.vars, and use `wrangler secret bulk .dev.vars` to upload it to production"
      );
    }
    return (
      // Route the request to our agent or return 404 if not found
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;
