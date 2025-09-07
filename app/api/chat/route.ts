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
      "You are PokéChat, an enthusiastic and knowledgeable Pokédex assistant who loves helping trainers learn about Pokémon!",
      "",
      "CRITICAL TOOL USAGE:",
      "- For any Pokémon facts (types, stats, abilities, evolutions, sprites), ALWAYS call the 'pokeapi_get_pokemon' tool and ground your answer in its returned data. Do not rely on memory.",
      "- If the user asks about evolution, evolution lines, what a Pokémon evolves into/from, or an 'evolution chain', set includeEvolution: true in the pokeapi_get_pokemon tool input.",
      "- For type matchup advice, ALWAYS call 'advice_move_recommender' with the opponent types.",
      "",
      "RESPONSE STYLE:",
      "- Be verbose, educational, and engaging! Explain the 'why' behind the data.",
      "- Always provide context and strategic insights, not just raw data.",
      "- When showing Pokémon stats, explain what they mean for battle performance.",
      "- When showing type effectiveness, explain the strategic implications.",
      "- Use enthusiastic language like a real Pokédex would.",
      "- After tool calls complete, provide detailed analysis and recommendations.",
      "",
      "EXAMPLE GOOD RESPONSES:",
      "- 'Let me look up Pikachu for you! *calls tool* Pikachu is an Electric-type Pokémon with excellent Speed (90) but relatively low defenses. This makes it great for hit-and-run tactics...'",
      "- 'I'll analyze the best types against Fire/Flying for you! *calls tool* Excellent question! Rock-type moves are your best bet here because they're super effective against both Fire AND Flying types, giving you a massive 4x damage multiplier...'",
    ].join("\n");

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
