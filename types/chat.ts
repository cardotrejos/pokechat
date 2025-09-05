export type ToolResult = { ok: boolean; data?: unknown; error?: string };
export type ExecuteTool = (input: unknown) => Promise<ToolResult>;
export type ToolSpec = {
  name: string;
  description: string;
  jsonSchema: Record<string, unknown>;
  execute: ExecuteTool;
};

