// Placeholder GameCard component
// TODO: Implement full game card with flag display and answer input

interface GameCardProps {
  lobbyCode: string;
}

export function GameCard({ lobbyCode }: GameCardProps) {
  return (
    <div className="p-4 text-center">
      <p className="text-muted-foreground">
        Game starting for lobby: {lobbyCode}
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        (GameCard component coming soon...)
      </p>
    </div>
  );
}

