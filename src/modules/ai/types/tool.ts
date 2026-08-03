import type { ToolCategory } from "@/modules/ai/constants/tool-categories";

export interface AiToolDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  inputSchema: Record<string, string>;
  isEnabled: boolean;
}

export interface AiToolCall {
  id: string;
  toolSlug: string;
  input: Record<string, unknown>;
  status: "pending" | "completed" | "failed";
  output?: string;
  error?: string;
}

export interface AiToolExecutionResult {
  toolSlug: string;
  success: boolean;
  output: string;
  metadata?: Record<string, string>;
}

export type AiToolHandler = (
  input: Record<string, unknown>,
) => Promise<AiToolExecutionResult> | AiToolExecutionResult;

export interface RegisteredAiTool extends AiToolDefinition {
  handler?: AiToolHandler;
}
