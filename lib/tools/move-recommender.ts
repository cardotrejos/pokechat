import type { ToolSpec, ToolResult } from "@/types/chat";

export function createMoveRecommenderTool(): ToolSpec {
  const spec: ToolSpec = {
    name: "advice.moveRecommender",
    description: "Recommend attacking types vs opponent types (stub)",
    jsonSchema: {},
    async execute(_input: unknown): Promise<ToolResult> {
      return { ok: true, data: [] };
    },
  };
  return spec;
}

