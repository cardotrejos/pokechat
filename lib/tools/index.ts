import type { ToolSpec } from "@/types/chat";

const tools: ToolSpec[] = [];

export function listTools(): ToolSpec[] {
  return tools;
}

export function getToolByName(name: string): ToolSpec | undefined {
  return tools.find((t) => t.name === name);
}

