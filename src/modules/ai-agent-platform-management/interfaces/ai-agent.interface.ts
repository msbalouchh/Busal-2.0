import type { AgentCategory, AgentStatus } from "@prisma/client";

import type { IAIContext } from "@/modules/ai-agent-platform-management/interfaces/ai-context.interface";
import type { IAIResponse } from "@/modules/ai-agent-platform-management/interfaces/ai-response.interface";

export interface IAIAgent {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly category: AgentCategory;
  readonly status: AgentStatus;
  readonly version: string;
  initialize(context: IAIContext): Promise<void>;
  execute(context: IAIContext, input: Record<string, unknown>): Promise<IAIResponse>;
}

export interface IAIAgentDefinition {
  slug: string;
  name: string;
  category: AgentCategory;
  version: string;
  description?: string;
  factory: () => IAIAgent;
}
