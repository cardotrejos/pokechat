export type ChatRole = "user" | "assistant" | "system" | "tool";
export type ChatMessage = { id: string; role: ChatRole; content: string };

export type SSEServerEvent =
  | { type: "text"; delta: string }
  | { type: "tool_call"; toolName: string; input: unknown }
  | { type: "tool_result"; toolName: string; ok: boolean; data?: unknown; error?: string }
  | { type: "error"; message: string }
  | { type: "done" };

export type ToolResult = { ok: boolean; data?: unknown; error?: string };
export type ExecuteTool = (input: unknown) => Promise<ToolResult>;
export type ToolSpec = {
  name: string;
  description: string;
  jsonSchema: Record<string, unknown>;
  execute: ExecuteTool;
};
