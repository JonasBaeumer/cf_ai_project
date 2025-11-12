/**
 * SystemMessage component for displaying server-generated messages
 * These appear distinct from user/assistant messages with [SERVER] prefix
 */

interface SystemMessageProps {
  content: string;
  timestamp: number;
}

export function SystemMessage({ content, timestamp }: SystemMessageProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex justify-center my-3 px-4">
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg max-w-md shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Server badge */}
        <div className="flex items-center justify-center mb-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
            [SERVER]
          </span>
        </div>
        
        {/* Message content */}
        <p className="text-sm text-gray-700 dark:text-gray-300 text-center whitespace-pre-wrap">
          {content}
        </p>
        
        {/* Timestamp */}
        <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
          {formatTime(timestamp)}
        </div>
      </div>
    </div>
  );
}


