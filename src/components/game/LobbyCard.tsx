import { useState } from "react";
import { Button } from "@/components/button/Button";
import { useGameLobby } from "@/hooks/useGameLobby";
import { Copy, Users } from "@phosphor-icons/react";
import { GameCard } from "./GameCard";

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
  const { players, gameState, connected, startGame } = useGameLobby(
    data.invitationCode,
    data.playerId
  );

  // Debug: log players whenever it changes
  console.log('LobbyCard received players:', players, 'length:', players?.length);

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
    console.log("Start game clicked");
    startGame();
  };

  // If game has started, show GameCard instead
  if (gameState.status !== 'waiting') {
    return (
      <GameCard 
        lobbyCode={data.invitationCode}
        playerId={data.playerId}
        playerName={data.playerName}
      />
    );
  }

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
          Players ({players?.length || 0}):
        </p>
        <div className="space-y-2">
          {players && players.length > 0 ? (
            players.map((player, index) => (
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