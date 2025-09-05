import type { ToolSpec } from "@/types/chat";
import { createPokeTools } from "@/lib/tools/pokeapi";
import { createMoveRecommenderTool } from "@/lib/tools/move-recommender";

const tools: ToolSpec[] = [
  ...createPokeTools(),
  createMoveRecommenderTool(),
];

export function listTools(): ToolSpec[] {
  return tools;
}

export function getToolByName(name: string): ToolSpec | undefined {
  return tools.find((t) => t.name === name);
}
