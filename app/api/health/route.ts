import { NextResponse } from "next/server";
import { getAnthropic } from "@/lib/anthropic/client";

export const runtime = "nodejs";

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const out = await p;
    clearTimeout(t);
    return out;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

export async function GET() {
  const anthropicCheck = (async () => {
    try {
      const anthropic = getAnthropic();
      // minimal request to validate key + reachability
      const res: any = await withTimeout(
        anthropic.messages.create({
          model: process.env.ANTHROPIC_MODEL || "claude-3-7-sonnet-latest",
          max_tokens: 1,
          messages: [{ role: "user", content: "ping" }],
          system: "healthcheck",
        }) as any,
        4000
      );
      return { ok: !!res?.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { ok: false, error: message };
    }
  })();

  const pokeapiCheck = (async () => {
    try {
      const res = await withTimeout(fetch("https://pokeapi.co/api/v2/pokemon/1", { method: "GET" }), 4000);
      return { ok: res.ok };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { ok: false, error: message };
    }
  })();

  const [anthropic, pokeapi] = await Promise.all([anthropicCheck, pokeapiCheck]);
  return NextResponse.json({ anthropic, pokeapi });
}

