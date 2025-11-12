/**
 * Message types for the chat application
 * Supports user, assistant, and system (server-generated) messages
 */

export type ChatMessageRole = "user" | "assistant" | "system";

export interface UserMessage {
  role: "user";
  content: string;
  createdAt?: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: string;
  createdAt?: string;
}

export interface SystemMessage {
  role: "system";
  content: string;
  source: "game_server";
  timestamp: number;
  createdAt?: string;
}

export type ChatMessage = UserMessage | AssistantMessage | SystemMessage;

/**
 * Type guard to check if a message is a system message
 */
export function isSystemMessage(message: any): message is SystemMessage {
  return (
    message &&
    message.role === "system" &&
    message.source === "game_server" &&
    typeof message.content === "string" &&
    typeof message.timestamp === "number"
  );
}


