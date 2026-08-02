import type { IAIContext } from "@/modules/ai-agent-platform-management/interfaces/ai-context.interface";

export interface IAIToolResult {
  success: boolean;
  output: Record<string, unknown>;
  error?: string;
}

export interface IAITool {
  readonly toolKey: string;
  readonly name: string;
  readonly description: string;
  execute(context: IAIContext, input: Record<string, unknown>): Promise<IAIToolResult>;
}

export interface IAIToolDefinition {
  toolKey: string;
  name: string;
  description: string;
  factory: () => IAITool;
}
