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
  const { players, gameState, connected, startGame, sendChatMessage } =
    useGameLobby(data.invitationCode, data.playerId);
  const { registerPlayerChat, unregisterPlayerChat } = useAgentContext();

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

  // Keep showing lobby card - don't switch to GameCard
  // The agent will display flags and handle answers in chat
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users size={20} className="text-[#F48120]" />
        <h3 className="font-semibold text-lg">Game Lobby</h3>
        {connected && (
          <span className="text-xs text-green-500">● Connected</span>
        )}
        {!connected && (
          <span className="text-xs text-gray-400">○ Connecting...</span>
        )}
      </div>

      {/* Invitation Code */}
      <div className="bg-background/80 p-3 rounded-md">
        <p className="text-xs text-muted-foreground mb-1">Invitation Code:</p>
        <div className="flex items-center gap-2">
          <code className="text-lg font-mono font-bold text-[#F48120]">
            {data.invitationCode}
          </code>
          <Button size="sm" variant="secondary" onClick={handleCopyCode}>
            <Copy size={14} />
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Players List */}
      <div>
        <p className="text-sm font-medium mb-2">
          Players ({players?.length || 0}):
        </p>
        <div className="space-y-2">
          {players && players.length > 0 ? (
            players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  {/* Connection status dot */}
                  <div
                    className={`w-2 h-2 rounded-full ${player.connected ? "bg-green-500" : "bg-gray-400"}`}
                  />

                  {/* Player name */}
                  <span className="text-sm">
                    {player.name}
                    {player.id === data.playerId && (
                      <span className="text-[#F48120] ml-1">(You)</span>
                    )}
                    {index === 0 && (
                      <span className="text-muted-foreground ml-1">(Host)</span>
                    )}
                  </span>
                </div>

                {/* Score - show if game is in progress */}
                {gameState.status !== "waiting" && (
                  <span className="text-sm font-semibold text-[#F48120]">
                    {player.totalScore || 0} pts
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">
                {data.playerName}
                <span className="text-[#F48120] ml-1">(You)</span>
                <span className="text-muted-foreground ml-1">(Host)</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {/* Info message for host */}
        {players && players.length > 0 && players[0].id === data.playerId && (
          <div className="text-sm text-muted-foreground text-center py-2 px-3 bg-[#F48120]/5 rounded">
            Ready to play? Tell me "Start the game" to begin! 🎮
          </div>
        )}

        {/* If no players array yet, show for the creator */}
        {(!players || players.length === 0) && (
          <div className="text-sm text-muted-foreground text-center py-2 px-3 bg-[#F48120]/5 rounded">
            Ready to play? Tell me "Start the game" to begin! 🎮
          </div>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => console.log("Leave lobby")}
          className="w-full"
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
