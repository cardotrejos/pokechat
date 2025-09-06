import { NextResponse } from "next/server";
import { createChatSSEStream } from "@/lib/anthropic/stream";
import { listTools } from "@/lib/tools";
import type { ChatMessage } from "@/types/chat";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid body: messages[] required" }, { status: 400 });
    }
    
    // Debug logging
    console.log("[API] Received request with", messages.length, "messages");
    console.log("[API] Available tools:", listTools().map(t => t.name));

    const system = [
      "You are PokéChat, a helpful Pokédex assistant.",
      "CRITICAL: For any Pokémon facts (types, stats, abilities, evolutions, sprites), ALWAYS call the 'pokeapi_get_pokemon' tool and ground the answer in its returned data. Do not rely on memory.",
      "For matchup advice, prefer calling 'advice_move_recommender' with the opponent types and summarize the top results.",
      "Be concise and format lists clearly.",
    ].join(" \n");

    const stream = createChatSSEStream({
      messages,
      tools: listTools(),
      system,
    });

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
