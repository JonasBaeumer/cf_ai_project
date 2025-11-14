import { useState } from "react";
import type { ToolUIPart } from "ai";
import { Robot, CaretDown } from "@phosphor-icons/react";
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { APPROVAL } from "@/shared";

interface ToolResultWithContent {
  content: Array<{ type: string; text: string }>;
}

function renderGameToolResult(toolType: string, result: any) {
  switch (toolType) {
    case "tool-createGameLobby":
      if (result && result.success) {
        return (
          <div className="text-sm text-green-600 dark:text-green-400 p-3 bg-green-50 dark:bg-green-900/20 rounded">
            ✓ Game lobby created! Check the right sidebar for lobby details.
          </div>
        );
      }
      return null;
    case "tool-joinGameLobby":
      if (result && result.success) {
        return (
          <div className="text-sm text-green-600 dark:text-green-400 p-3 bg-green-50 dark:bg-green-900/20 rounded">
            ✓ Joined the lobby! Check the right sidebar for lobby details.
          </div>
        );
      }
      return null;
    case "tool-startGame":
      return (
        <div className="text-sm text-green-600 dark:text-green-400 p-3 bg-green-50 dark:bg-green-900/20 rounded">
          ✓ Game started! Watch the right sidebar for game updates.
        </div>
      );
    default:
      return null;
  }
}

function isToolResultWithContent(
  result: unknown
): result is ToolResultWithContent {
  return (
    typeof result === "object" &&
    result !== null &&
    "content" in result &&
    Array.isArray((result as ToolResultWithContent).content)
  );
}

interface ToolInvocationCardProps {
  toolUIPart: ToolUIPart;
  toolCallId: string;
  needsConfirmation: boolean;
  onSubmit: ({
    toolCallId,
    result
  }: {
    toolCallId: string;
    result: string;
  }) => void;
  addToolResult: (toolCallId: string, result: string) => void;
}

export function ToolInvocationCard({
  toolUIPart,
  toolCallId,
  needsConfirmation,
  onSubmit
  // addToolResult
}: ToolInvocationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4 my-3 w-full max-w-[500px] rounded-md bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 cursor-pointer"
      >
        <div
          className={`${needsConfirmation ? "bg-[#F48120]/10" : "bg-[#F48120]/5"} p-1.5 rounded-full flex-shrink-0`}
        >
          <Robot size={16} className="text-[#F48120]" />
        </div>
        <h4 className="font-medium flex items-center gap-2 flex-1 text-left">
          {toolUIPart.type}
          {!needsConfirmation && toolUIPart.state === "output-available" && (
            <span className="text-xs text-[#F48120]/70">✓ Completed</span>
          )}
        </h4>
        <CaretDown
          size={16}
          className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`transition-all duration-200 ${isExpanded ? "max-h-[200px] opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"}`}
      >
        <div
          className="overflow-y-auto"
          style={{ maxHeight: isExpanded ? "180px" : "0px" }}
        >
          <div className="mb-3">
            <h5 className="text-xs font-medium mb-1 text-muted-foreground">
              Arguments:
            </h5>
            <pre className="bg-background/80 p-2 rounded-md text-xs overflow-auto whitespace-pre-wrap break-words max-w-[450px]">
              {JSON.stringify(toolUIPart.input, null, 2)}
            </pre>
          </div>

          {needsConfirmation && toolUIPart.state === "input-available" && (
            <div className="flex gap-2 justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSubmit({ toolCallId, result: APPROVAL.NO })}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSubmit({ toolCallId, result: APPROVAL.YES })}
              >
                Approve
              </Button>
            </div>
          )}

          {!needsConfirmation && toolUIPart.state === "output-available" && (
            <div className="mt-3 border-t border-[#F48120]/10 pt-3">
              {(() => {
                const result = toolUIPart.output;
                const gameUI = renderGameToolResult(toolUIPart.type, result);

                // If it's a game tool, render custom UI
                if (gameUI) {
                  return gameUI;
                }

                // Otherwise, render JSON result as before
                return (
                  <>
                    <h5 className="text-xs font-medium mb-1 text-muted-foreground">
                      Result:
                    </h5>
                    <pre className="bg-background/80 p-2 rounded-md text-xs overflow-auto whitespace-pre-wrap break-words max-w-[450px]">
                      {(() => {
                        if (isToolResultWithContent(result)) {
                          return result.content
                            .map((item: { type: string; text: string }) => {
                              if (
                                item.type === "text" &&
                                item.text.startsWith("\n~ Page URL:")
                              ) {
                                const lines = item.text
                                  .split("\n")
                                  .filter(Boolean);
                                return lines
                                  .map(
                                    (line: string) =>
                                      `- ${line.replace("\n~ ", "")}`
                                  )
                                  .join("\n");
                              }
                              return item.text;
                            })
                            .join("\n");
                        }
                        return JSON.stringify(result, null, 2);
                      })()}
                    </pre>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
