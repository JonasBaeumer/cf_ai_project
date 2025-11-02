import { createContext, useContext } from 'react';

/**
 * Context for sending messages to the AI agent from anywhere in the app
 */
interface AgentContextType {
  sendMessage: (text: string) => Promise<void>;
}

export const AgentContext = createContext<AgentContextType | null>(null);

/**
 * Hook to access agent message sending capability
 */
export function useAgentContext() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgentContext must be used within AgentContext.Provider');
  }
  return context;
}

