import { useState } from "react";
import { Button } from "@/components/button/Button";
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

export function LobbyCard({ data }: LobbyCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(data.invitationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleStartGame = async () => {
    // TODO: We'll implement this later with the WebSocket hook
    console.log("Start game clicked");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users size={20} className="text-[#F48120]" />
        <h3 className="font-semibold text-lg">Game Lobby</h3>
      </div>

      {/* Invitation Code */}
      <div className="bg-background/80 p-3 rounded-md">
        <p className="text-xs text-muted-foreground mb-1">Invitation Code:</p>
        <div className="flex items-center gap-2">
          <code className="text-lg font-mono font-bold text-[#F48120]">
            {data.invitationCode}
          </code>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyCode}
          >
            <Copy size={14} />
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Players List */}
      <div>
        <p className="text-sm font-medium mb-2">
          Players ({data.players?.length || 1}):
        </p>
        <div className="space-y-2">
          {data.players && data.players.length > 0 ? (
            data.players.map((player, index) => (
              <div key={player.id} className="flex items-center gap-2">
                {/* Connection status dot */}
                <div className={`w-2 h-2 rounded-full ${player.connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                
                {/* Player name */}
                <span className="text-sm">
                  {player.name}
                  {player.id === data.playerId && <span className="text-[#F48120] ml-1">(You)</span>}
                  {index === 0 && <span className="text-muted-foreground ml-1">(Host)</span>}
                </span>
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
      <div className="flex gap-2">
        {/* Start Game button - only show for host (first player) */}
        {data.players && data.players.length > 0 && data.players[0].id === data.playerId && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleStartGame}
            className="flex-1"
          >
            Start Game
          </Button>
        )}
        
        {/* If no players array yet, show for the creator */}
        {(!data.players || data.players.length === 0) && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleStartGame}
            className="flex-1"
          >
            Start Game
          </Button>
        )}
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => console.log("Leave lobby")}
        >
          Leave
        </Button>
      </div>
    </div>
  );
}