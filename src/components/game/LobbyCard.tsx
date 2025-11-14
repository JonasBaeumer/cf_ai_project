import { useState, memo, useEffect } from "react";
import { Button } from "@/components/button/Button";
import { useGameLobby } from "@/hooks/useGameLobby";
import { useAgentContext } from "@/contexts/AgentContext";
import { Copy, Users } from "@phosphor-icons/react";

interface LobbyCardProps {
  data: {
    success: boolean;
    invitationCode: string;
    playerId: string;
    playerName: string;
    players?: Array<{ id: string; name: string; connected: boolean }>;
  };
}

function LobbyCardComponent({ data }: LobbyCardProps) {
  const [copied, setCopied] = useState(false);
  const { players, gameState, connected, startGame, sendChatMessage, leaveLobby } =
    useGameLobby(data.invitationCode, data.playerId);
  const { registerPlayerChat, unregisterPlayerChat, clearActiveLobby } = useAgentContext();

  // Register player chat function with the main app context
  useEffect(() => {
    registerPlayerChat(sendChatMessage);
    return () => {
      unregisterPlayerChat();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(data.invitationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleLeave = () => {
    // Unregister player chat first
    unregisterPlayerChat();
    // Clear the lobby from app state (removes lobby card from sidebar)
    clearActiveLobby();
    // Then leave the lobby (closes WebSocket, clears state)
    leaveLobby();
  };

  // Keep showing lobby card - don't switch to GameCard
  // The agent will display flags and handle answers in chat
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Users size={16} className="text-[#F48120]" />
        <h3 className="font-semibold text-sm">Lobby</h3>
        {connected && (
          <span className="text-xs text-green-500">●</span>
        )}
        {!connected && (
          <span className="text-xs text-gray-400">○</span>
        )}
      </div>

      {/* Invitation Code */}
      <div className="bg-background/80 p-2 rounded-md">
        <p className="text-xs text-muted-foreground mb-0.5">Code:</p>
        <div className="flex items-center gap-1.5">
          <code className="text-sm font-mono font-bold text-[#F48120]">
            {data.invitationCode}
          </code>
          <Button size="sm" variant="secondary" onClick={handleCopyCode} className="h-6 px-2 text-xs">
            <Copy size={12} />
            {copied ? "✓" : ""}
          </Button>
        </div>
      </div>

      {/* Players List */}
      <div>
        <p className="text-xs font-medium mb-1">
          Players ({players?.length || 0}):
        </p>
        <div className="space-y-1">
          {players && players.length > 0 ? (
            players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between gap-1"
              >
                <div className="flex items-center gap-1.5">
                  {/* Connection status dot */}
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${player.connected ? "bg-green-500" : "bg-gray-400"}`}
                  />

                  {/* Player name */}
                  <span className="text-xs truncate">
                    {player.name}
                    {player.id === data.playerId && (
                      <span className="text-[#F48120] ml-0.5">(You)</span>
                    )}
                    {index === 0 && (
                      <span className="text-muted-foreground ml-0.5">(Host)</span>
                    )}
                  </span>
                </div>

                {/* Score - show if game is in progress */}
                {gameState.status !== "waiting" && (
                  <span className="text-xs font-semibold text-[#F48120] whitespace-nowrap">
                    {player.totalScore || 0} pts
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs">
                {data.playerName}
                <span className="text-[#F48120] ml-0.5">(You)</span>
                <span className="text-muted-foreground ml-0.5">(Host)</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5">
        {/* Info message for host */}
        {((players && players.length > 0 && players[0].id === data.playerId) || 
          (!players || players.length === 0)) && (
          <div className="text-xs text-muted-foreground text-center py-1.5 px-2 bg-[#F48120]/5 rounded">
            Say "Start the game" to begin! 🎮
          </div>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={handleLeave}
          className="w-full h-7 text-xs"
        >
          Leave
        </Button>
      </div>
    </div>
  );
}

// Memoize with deep comparison of data prop
export const LobbyCard = memo(LobbyCardComponent, (prevProps, nextProps) => {
  // Only re-render if critical data changes
  return (
    prevProps.data.invitationCode === nextProps.data.invitationCode &&
    prevProps.data.playerId === nextProps.data.playerId &&
    prevProps.data.playerName === nextProps.data.playerName
  );
});
