/**
 * GameEventsSidebar - Displays server-generated game events
 * Shows countdown, flags, results, and game end messages
 */

import { useEffect, useRef } from 'react';
import { Card } from '@/components/card/Card';
import { MemoizedMarkdown } from '@/components/memoized-markdown';

interface GameEvent {
  id: string;
  content: string;
  timestamp: number;
}

interface GameEventsSidebarProps {
  events: GameEvent[];
  isVisible: boolean;
}

export function GameEventsSidebar({ events, isVisible }: GameEventsSidebarProps) {
  const eventsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event
  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col border-l border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
            SERVER
          </span>
          <h3 className="font-semibold text-sm">Game Events</h3>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4 pb-14 space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p className="mb-2">🎮</p>
            <p>Game events will appear here</p>
            <p className="text-xs mt-1">Start a game to see live updates</p>
          </div>
        ) : (
          <>
            {events.map((event) => (
              <Card
                key={event.id}
                className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm"
              >
                {/* Event content - render as markdown */}
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                  <MemoizedMarkdown id={event.id} content={event.content} />
                </div>
                
                {/* Timestamp */}
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
                  {formatTime(event.timestamp)}
                </div>
              </Card>
            ))}
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
            {events.length} event{events.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}

