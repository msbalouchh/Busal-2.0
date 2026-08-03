import type { BuiltinAgentSlug } from "@/modules/ai/constants/agent-slugs";

export interface AiAgentDefinition {
  slug: BuiltinAgentSlug | (string & {});
  name: string;
  description: string;
  systemPromptTemplate: string;
  toolSlugs: string[];
  memoryTypes: string[];
  isBuiltin: boolean;
  isReplaceable: boolean;
  priority: number;
}

export interface AiAgentRuntimeContext {
  agentSlug: string;
  userId: string;
  tenantId: string | null;
  workspaceId: string | null;
  businessId: string | null;
  branchId: string | null;
  permissions: ReadonlySet<string>;
  metadata: Record<string, string>;
}

export interface AiAgentResponse {
  content: string;
  agentSlug: string;
  toolCalls: string[];
  memoryKeysWritten: string[];
  providerId: string;
  model: string;
}
