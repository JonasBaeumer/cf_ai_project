import { createContext, useContext } from 'react';

/**
 * Context for sending messages to the AI agent and adding system messages
 */
interface AgentContextType {
  sendMessage: (text: string) => Promise<void>;
  addSystemMessage: (content: string) => void;
}

export const AgentContext = createContext<AgentContextType | null>(null);

/**
 * Hook to access agent message sending capability and system message addition
 */
export function useAgentContext() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgentContext must be used within AgentContext.Provider');
  }
  return context;
}

