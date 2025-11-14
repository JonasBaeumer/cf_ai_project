/**
 * GameEventsSidebar - Displays server-generated game events
 * Shows countdown, flags, results, and game end messages
 */

import { useEffect, useRef } from "react";
import { Card } from "@/components/card/Card";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { LobbyCard } from "@/components/game/LobbyCard";

interface GameEvent {
  id: string;
  content: string;
  timestamp: number;
}

interface LobbyData {
  invitationCode: string;
  playerId: string;
  playerName: string;
}

interface GameEventsSidebarProps {
  events: GameEvent[];
  isVisible: boolean;
  lobbyData: LobbyData | null;
}

export function GameEventsSidebar({
  events,
  isVisible,
  lobbyData
}: GameEventsSidebarProps) {
  const eventsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event
  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <div className="h-full w-full flex flex-col border-l border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
            SERVER
          </span>
          <h3 className="font-semibold text-sm">Game Events</h3>
        </div>
      </div>

      {/* Lobby Card & Rules - Sticky at top when active */}
      {lobbyData && (
        <div className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 p-3 border-b border-neutral-300 dark:border-neutral-700 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            {/* Lobby Card - Compact */}
            <div>
              <LobbyCard 
                data={{
                  success: true,
                  invitationCode: lobbyData.invitationCode,
                  playerId: lobbyData.playerId,
                  playerName: lobbyData.playerName
                }}
              />
            </div>

            {/* Game Rules - Always visible */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  RULES
                </span>
              </div>
              <div className="text-xs space-y-2 text-gray-700 dark:text-gray-300">
                <div>
                  <p className="font-semibold text-[#F48120] mb-1">How to Play:</p>
                  <ul className="space-y-0.5 list-disc list-inside">
                    <li>See flag emoji each round</li>
                    <li>Type country name</li>
                    <li>15 seconds per round</li>
                    <li>Faster = more points!</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[#F48120] mb-1">Scoring:</p>
                  <ul className="space-y-0.5 list-disc list-inside">
                    <li>Correct: 100 pts</li>
                    <li>Speed bonus: +50 pts</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4 pb-22 space-y-3">
        {events.length === 0 && !lobbyData ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p className="mb-2">🎮</p>
            <p>Game events will appear here</p>
            <p className="text-xs mt-1">Start a game to see live updates</p>
          </div>
        ) : (
          <>
            {events.map((event) => {
              // Check if this is a flag message
              const isFlagMessage = event.content.startsWith("FLAG_CODE|");
              let countryCode = "";
              let displayContent = event.content;
              
              if (isFlagMessage) {
                // Extract country code and actual content
                const parts = event.content.split("|");
                countryCode = parts[1];
                displayContent = parts.slice(2).join("|");
              }

              return (
                <Card
                  key={event.id}
                  className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm"
                >
                  {isFlagMessage ? (
                    // Special layout for flag messages: text on left, flag image on right
                    <div className="flex gap-3 items-start">
                      <div className="flex-1">
                        {/* Event content - render as markdown */}
                        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                          <MemoizedMarkdown id={event.id} content={displayContent} />
                        </div>
                        {/* Timestamp */}
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {formatTime(event.timestamp)}
                        </div>
                      </div>
                      {/* Flag image */}
                      <div className="flex-shrink-0">
                        <img 
                          src={`https://flagcdn.com/h120/${countryCode}.png`}
                          alt="Country flag"
                          className="w-24 h-16 object-cover rounded border-2 border-gray-300 dark:border-gray-600 shadow-md"
                          loading="lazy"
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    // Normal message layout
                    <>
                      {/* Event content - render as markdown */}
                      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                        <MemoizedMarkdown id={event.id} content={displayContent} />
                      </div>

                      {/* Timestamp */}
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
                        {formatTime(event.timestamp)}
                      </div>
                    </>
                  )}
                </Card>
              );
            })}
            {/* Extra padding at bottom to prevent cutoff */}
            <div className="h-4" />
            <div ref={eventsEndRef} />
          </>
        )}
      </div>

      {/* Footer (optional - could show game state) */}
      {events.length > 0 && (
        <div className="px-4 py-2 border-t border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="text-xs text-muted-foreground text-center">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
