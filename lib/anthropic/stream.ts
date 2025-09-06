import { getAnthropic } from "@/lib/anthropic/client";
import type { ChatMessage, SSEServerEvent, ToolSpec } from "@/types/chat";

type CreateStreamArgs = {
  messages: ChatMessage[];
  tools: ToolSpec[];
  system?: string;
  signal?: AbortSignal;
};

export function createChatSSEStream({ messages, tools, system, signal }: CreateStreamArgs): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const reqId = Math.random().toString(36).slice(2, 10);

  function sse(event: SSEServerEvent): string {
    const type = event.type;
    const data = JSON.stringify(event);
    return `event: ${type}\n` + `data: ${data}\n\n`;
  }

  function write(controller: ReadableStreamDefaultController<Uint8Array>, event: SSEServerEvent) {
    try {
      controller.enqueue(encoder.encode(sse(event)));
      if (process.env.DEBUG) {
        try {
          const brief = { ...event } as any;
          if (brief.type === "text") brief.delta = String(brief.delta).slice(0, 120);
          if (brief.type === "tool_result" && brief.data) brief.data = "<omitted>";
          console.log(`[sse ${reqId}]`, brief);
        } catch {}
      }
    } catch (err) {
      if (process.env.DEBUG) {
        console.error(`[write error ${reqId}] Failed to write event:`, err);
      }
    }
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const anthropic = getAnthropic();
      const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";

      const anthropicTools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: {
          type: "object" as const,
          ...t.jsonSchema,
        },
      }));

      if (process.env.DEBUG) {
        console.log(`[anthropic ${reqId}] tools:`, anthropicTools.map((t) => ({ name: t.name })));
      }

      const mapped = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      // Heuristic tool choice to encourage tool use
      function chooseTool(): any | undefined {
        const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content?.toLowerCase?.() || "";
        const wantsAdvice = /(best types|versus|\bvs\.?\b|weak against|resist|effective against|super\s*effective)/.test(lastUser);
        const wantsPokemon = /(\bpok[eé]mon\b|\bstats?\b|\babilities\b|\bevolution\b|\bsprite\b|\bpokedex\b|\bshow me\b|\bwhat is\b|\bwho is\b)/.test(lastUser);
        
        // Check for move effectiveness first
        if (wantsAdvice) return { type: "tool", name: "advice_move_recommender" };
        if (wantsPokemon) return { type: "tool", name: "pokeapi_get_pokemon" };
        return { type: "any" };
      }
      const tool_choice = chooseTool();

      if (process.env.DEBUG) {
        console.log(`[anthropic ${reqId}] Creating stream with:`, {
          model,
          messageCount: mapped.length,
          toolCount: anthropicTools.length,
          tools: anthropicTools.map(t => ({ name: t.name, hasSchema: !!t.input_schema })),
        });
        console.log(`[anthropic ${reqId}] tool_choice:`, tool_choice);
      }

      const ac = new AbortController();
      const onAbort = () => {
        try { ac.abort(); } catch {}
        try {
          write(controller, { type: "done" });
          controller.close();
        } catch {}
      };
      if (signal) {
        if (signal.aborted) return onAbort();
        signal.addEventListener("abort", onAbort, { once: true });
      }

      try {
        if (process.env.DEBUG) {
          console.log(`[anthropic ${reqId}] Request params:`, {
            model,
            messagesCount: mapped.length,
            firstMessage: mapped[0],
            tools: anthropicTools.length,
            system: system?.substring(0, 100),
            tool_choice,
          });
        }
        
        const stream = anthropic.messages.stream({
          model,
          messages: mapped,
          tools: anthropicTools,
          system,
          max_tokens: 2048,
          tool_choice,
        });

        // Store promises for tool executions
        const toolExecutions: Promise<void>[] = [];

        // Handle text chunks
        stream.on("text", (delta: string) => {
          write(controller, { type: "text", delta });
        });

        // Handle errors
        stream.on("error", (e: any) => {
          const message = e instanceof Error ? e.message : String(e ?? "Stream error");
          if (process.env.DEBUG) {
            console.error(`[stream error ${reqId}]`, e);
          }
          write(controller, { type: "error", message });
        });

        // Handle the final message which contains tool use blocks
        stream.on("message", (msg: any) => {
          if (process.env.DEBUG) {
            console.log(`[stream message ${reqId}]`, { 
              stop_reason: msg.stop_reason,
              content_length: msg.content?.length,
              content_type: msg.content?.[0]?.type
            });
          }

          // Process tool use blocks from the message
          if (msg.content && Array.isArray(msg.content)) {
            for (const block of msg.content) {
              if (block.type === "tool_use") {
                const toolName = block.name;
                const toolInput = block.input;
                const toolId = block.id;
                
                // Create an async task for tool execution
                const toolPromise = (async () => {
                  if (process.env.DEBUG) {
                    console.log(`[tool_use ${reqId}]`, { id: toolId, name: toolName, input: toolInput });
                  }

                  // Notify client about tool call
                  write(controller, { type: "tool_call", toolName, input: toolInput });
                  
                  // Execute the tool
                  const spec = tools.find((t) => t.name === toolName);
                  let result;
                  try {
                    if (!spec) throw new Error(`Unknown tool: ${toolName}`);
                    result = await spec.execute(toolInput);
                    if (process.env.DEBUG) {
                      console.log(`[tool_result ${reqId}]`, { name: toolName, ok: result.ok });
                    }
                  } catch (err) {
                    const message = err instanceof Error ? err.message : "Unknown error";
                    result = { ok: false, error: message };
                    if (process.env.DEBUG) {
                      console.error(`[tool_error ${reqId}]`, { name: toolName, error: message });
                    }
                  }
                  
                  // Send result to client
                  if (process.env.DEBUG) {
                    console.log(`[sending tool_result ${reqId}]`, { toolName, ok: !!result.ok, hasData: !!result.data });
                  }
                  write(controller, { type: "tool_result", toolName, ok: !!result.ok, data: result.data, error: result.error });
                })();
                
                toolExecutions.push(toolPromise);
              }
            }
          }
        });

        // Handle stream completion
        stream.on("end", () => {
          if (process.env.DEBUG) {
            console.log(`[stream end ${reqId}] Waiting for ${toolExecutions.length} tool executions...`);
          }
        });

        // Wait for stream to complete
        await stream.done();
        
        // Wait for all tool executions to finish
        if (toolExecutions.length > 0) {
          if (process.env.DEBUG) {
            console.log(`[stream ${reqId}] Waiting for tool executions to complete...`);
          }
          await Promise.all(toolExecutions);
          if (process.env.DEBUG) {
            console.log(`[stream ${reqId}] All tool executions completed`);
          }
        }
        
        // Now safe to close
        write(controller, { type: "done" });
        controller.close();
        
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (process.env.DEBUG) {
          console.error(`[anthropic ${reqId}] Stream error:`, err);
        }
        write(controller, {
          type: "error",
          message: `Unable to reach AI service. ${message}. Check ANTHROPIC_API_KEY and outbound network access.`,
        });
        write(controller, { type: "done" });
        controller.close();
      } finally {
        if (signal) signal.removeEventListener("abort", onAbort as any);
      }
    },
  });
}