"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage, SSEServerEvent } from "@/types/chat";
import PokemonCard from "@/app/components/PokemonCard";
import TypeEffectivenessCard from "@/app/components/TypeEffectivenessCard";
import ToolCallAccordion from "@/app/components/ToolCallAccordion";

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface ToolCall {
  toolName: string;
  input: any;
  result?: {
    ok: boolean;
    error?: string;
  };
}

interface MessageWithTools extends ChatMessage {
  toolCalls?: ToolCall[];
  toolResults?: Array<{
    toolName: string;
    data: any;
  }>;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<MessageWithTools[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onAbort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }, []);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg: MessageWithTools = { id: uuid(), role: "user", content: input.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: nextMessages }),
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        setLoading(false);
        setError("Chat service unavailable. Check server logs and network.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const assistantId = uuid();
      let assistantContent = "";
      let currentToolCalls: ToolCall[] = [];
      let currentToolResults: Array<{ toolName: string; data: any }> = [];
      
      // Add assistant message immediately
      setMessages((prev) => [...prev, { 
        id: assistantId, 
        role: "assistant", 
        content: "",
        toolCalls: [],
        toolResults: []
      }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const lines = chunk.split("\n");
          let eventType = "";
          let dataLine = "";
          for (const line of lines) {
            if (line.startsWith("event:")) eventType = line.slice(6).trim();
            if (line.startsWith("data:")) dataLine = line.slice(5).trim();
          }
          if (!eventType || !dataLine) continue;
          try {
            const evt = JSON.parse(dataLine) as SSEServerEvent;
            if (evt.type === "text") {
              assistantContent += evt.delta;
              setMessages((prev) => prev.map((m) => 
                m.id === assistantId 
                  ? { ...m, content: assistantContent }
                  : m
              ));
            } else if (evt.type === "tool_call") {
              const { toolName, input } = evt as any;
              const toolCall: ToolCall = { toolName, input };
              currentToolCalls.push(toolCall);
              setMessages((prev) => prev.map((m) => 
                m.id === assistantId 
                  ? { ...m, toolCalls: [...currentToolCalls] }
                  : m
              ));
            } else if (evt.type === "tool_result") {
              const { toolName, ok, data, error: toolError } = evt as any;
              // Update the tool call with result
              const callIndex = currentToolCalls.findIndex(c => c.toolName === toolName && !c.result);
              if (callIndex !== -1) {
                currentToolCalls[callIndex].result = { ok, error: toolError };
              }
              // Store the data if successful
              if (ok && data) {
                currentToolResults.push({ toolName, data });
                setMessages((prev) => prev.map((m) => 
                  m.id === assistantId 
                    ? { ...m, toolCalls: [...currentToolCalls], toolResults: [...currentToolResults] }
                    : m
                ));
              }
            } else if (evt.type === "error") {
              setError(evt.message);
            } else if (evt.type === "done") {
              // If no text content was provided but we have tool results, add a default message
              if (!assistantContent && currentToolResults.length > 0) {
                const defaultMsg = currentToolResults[0].toolName === "pokeapi_get_pokemon" 
                  ? "Here's the Pokémon information you requested:"
                  : "Here's the type effectiveness analysis:";
                setMessages((prev) => prev.map((m) => 
                  m.id === assistantId 
                    ? { ...m, content: defaultMsg }
                    : m
                ));
              }
            }
          } catch {
            // ignore malformed event
          }
        }
      }
    } catch (err) {
      // aborted or network error
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError("Network error talking to AI service.");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [input, messages, loading]);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mx-auto max-w-4xl">
        {/* Pokédex Shell */}
        <div className="rounded-2xl shadow-2xl overflow-hidden border border-red-700">
          {/* Top bar with lights */}
          <div className="bg-red-600 p-4 border-b border-red-700">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-300 border-4 border-white shadow-inner" aria-hidden />
              <div className="w-3 h-3 rounded-full bg-yellow-300 border border-black/20" aria-hidden />
              <div className="w-3 h-3 rounded-full bg-green-300 border border-black/20" aria-hidden />
            </div>
            <h1 className="mt-3 text-white font-semibold text-xl">PokéChat AI Assistant</h1>
          </div>

          {/* Screen */}
          <div className="bg-[#bfe6bf] px-4 py-5 border-y border-green-700">
            {error && (
              <div className="mb-3 rounded-md border border-red-300 bg-red-50 text-red-800 px-3 py-2 text-sm">
                {error}
              </div>
            )}
            <div className="rounded-lg bg-black/10 p-3 h-[500px] overflow-y-auto space-y-3">
              {messages.map((m) => (
                <div key={m.id}>
                  {/* User message */}
                  {m.role === "user" && (
                    <div className="text-right">
                      <div className="inline-block rounded-lg px-3 py-2 text-sm whitespace-pre-wrap max-w-[80%] bg-white/80 text-slate-900">
                        {m.content}
                      </div>
                    </div>
                  )}
                  
                  {/* Assistant message */}
                  {m.role === "assistant" && (
                    <div className="space-y-3">
                      {/* Text response */}
                      {m.content && (
                        <div className="text-left">
                          <div className="inline-block rounded-lg px-3 py-2 text-sm whitespace-pre-wrap max-w-[80%] bg-emerald-100 text-emerald-900">
                            {m.content}
                            {/* Tool call accordion */}
                            {m.toolCalls && m.toolCalls.length > 0 && (
                              <ToolCallAccordion toolCalls={m.toolCalls} />
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Tool result cards */}
                      {m.toolResults && m.toolResults.map((result, idx) => (
                        <div key={idx} className="flex justify-center my-3">
                          {result.toolName === "pokeapi_get_pokemon" && result.data && (
                            <PokemonCard data={result.data} />
                          )}
                          {result.toolName === "advice_move_recommender" && result.data && (
                            <TypeEffectivenessCard data={result.data} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Welcome message */}
              {messages.length === 0 && (
                <div className="text-center space-y-4 mt-8">
                  <div className="text-emerald-900/70 font-medium">
                    Welcome to PokéChat! I can help you with:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                    <button
                      onClick={() => setInput("Show me Pikachu stats")}
                      className="bg-white/70 hover:bg-white/90 text-emerald-800 px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      📊 Pokémon Stats
                    </button>
                    <button
                      onClick={() => setInput("What types are effective against dragon and ice?")}
                      className="bg-white/70 hover:bg-white/90 text-emerald-800 px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      ⚔️ Type Matchups
                    </button>
                    <button
                      onClick={() => setInput("Show me Charizard abilities")}
                      className="bg-white/70 hover:bg-white/90 text-emerald-800 px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      ✨ Abilities
                    </button>
                    <button
                      onClick={() => setInput("What is Bulbasaur's evolution?")}
                      className="bg-white/70 hover:bg-white/90 text-emerald-800 px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      🔄 Evolution
                    </button>
                  </div>
                </div>
              )}
              
              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-center items-center gap-2 py-2">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{animationDelay: "0ms"}} />
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{animationDelay: "150ms"}} />
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{animationDelay: "300ms"}} />
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Controls */}
          <form
            className="bg-red-50 p-4 flex flex-col gap-3 md:flex-row md:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              className="flex-1 rounded-md border border-red-200 px-3 py-2 bg-white text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="Ask about Pokémon stats, types, abilities, or type matchups..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-md bg-red-600 text-white px-4 py-2 font-medium shadow disabled:opacity-50 hover:bg-red-700 transition-colors"
                aria-label="Send (A)"
              >
                {loading ? "Thinking…" : "Send"}
              </button>
              {loading && (
                <button
                  type="button"
                  onClick={onAbort}
                  className="rounded-md bg-gray-500 text-white px-4 py-2 font-medium shadow hover:bg-gray-600 transition-colors"
                  aria-label="Abort (B)"
                >
                  Stop
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-4">
          Powered by Claude AI • PokéAPI • Type effectiveness calculator
        </div>
      </div>
    </div>
  );
}
