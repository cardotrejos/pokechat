import React, { useState } from "react";

interface ToolCall {
  toolName: string;
  input: any;
  result?: {
    ok: boolean;
    error?: string;
  };
}

interface ToolCallAccordionProps {
  toolCalls: ToolCall[];
}

export default function ToolCallAccordion({ toolCalls }: ToolCallAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (toolCalls.length === 0) return null;

  const getToolIcon = (toolName: string) => {
    if (toolName === "pokeapi_get_pokemon") return "🔍";
    if (toolName === "advice_move_recommender") return "⚔️";
    return "🔧";
  };

  const getToolLabel = (toolName: string) => {
    if (toolName === "pokeapi_get_pokemon") return "Fetching Pokémon Data";
    if (toolName === "advice_move_recommender") return "Calculating Type Effectiveness";
    return toolName;
  };

  return (
    <div className="mt-2 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">
            🤖 Tool Calls ({toolCalls.length})
          </span>
          {toolCalls.map((call, i) => (
            <span key={i} className="text-sm" title={getToolLabel(call.toolName)}>
              {getToolIcon(call.toolName)}
            </span>
          ))}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="px-3 py-2 border-t border-gray-200 bg-white">
          <div className="space-y-2">
            {toolCalls.map((call, index) => (
              <div key={index} className="text-xs">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">{getToolIcon(call.toolName)}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-700">
                      {getToolLabel(call.toolName)}
                    </div>
                    <div className="mt-1">
                      <span className="text-gray-500">Input:</span>
                      <code className="ml-1 px-1 py-0.5 bg-gray-100 rounded text-[10px]">
                        {JSON.stringify(call.input)}
                      </code>
                    </div>
                    {call.result && (
                      <div className="mt-1">
                        <span className="text-gray-500">Result:</span>
                        <span className={`ml-1 ${call.result.ok ? "text-green-600" : "text-red-600"}`}>
                          {call.result.ok ? "✓ Success" : `✗ ${call.result.error || "Failed"}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

