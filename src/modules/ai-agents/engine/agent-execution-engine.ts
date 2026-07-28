import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  assertAllowedTool,
  assertAgentBranchScope,
  assertAgentPermissions,
  loadAgentMemoryContext,
  type MemoryEngineDependencies,
} from "@/modules/ai-agents/engine/agent-memory-engine";
import { resolveSkillTools } from "@/modules/ai-agents/registry/agent-registry";
import type {
  AgentExecutionContext,
  AgentExecutionResult,
} from "@/modules/ai-agents/types/agent-types";

export interface AgentVersionProfile {
  personality: string | null;
  goals: string[];
  responsibilities: string[];
  behaviourRules: string[];
  allowedTools: string[];
  allowedKnowledgeCollections: string[];
  temperature: number;
  tokenLimit: number;
  skillIds: string[];
}

export interface AgentExecutionEngineInput {
  agentRecordId: string;
  agentBranchId: string | null;
  profile: AgentVersionProfile;
  context: AgentExecutionContext;
}

export async function runAgentExecution(
  platform: BusinessContext,
  input: AgentExecutionEngineInput,
  memoryDependencies: MemoryEngineDependencies,
): Promise<AgentExecutionResult> {
  assertAgentPermissions(platform, [
    PERMISSION_CODES.AI_AGENT_VIEW,
    PERMISSION_CODES.AI_TOOL_EXECUTE,
  ]);
  assertAgentBranchScope(platform, input.agentBranchId);

  const skillTools = resolveSkillTools(input.profile.skillIds);
  const effectiveTools = new Set([...input.profile.allowedTools, ...skillTools]);
  const prompt =
    input.context.input.prompt && typeof input.context.input.prompt === "string"
      ? input.context.input.prompt
      : "Analyse the request and respond with the next best action.";

  const memoryContext = await loadAgentMemoryContext(input.agentRecordId, memoryDependencies);

  const { retrieveKnowledge } = await import("@/services/ai-knowledge.service");
  const knowledge = await retrieveKnowledge(platform, prompt, {
    limit: 5,
    agentId: input.agentRecordId,
    collectionIds:
      input.profile.allowedKnowledgeCollections.length > 0
        ? input.profile.allowedKnowledgeCollections
        : undefined,
  });

  let toolCalls = 0;
  const toolOutputs: Record<string, unknown>[] = [];
  const toolCandidates = Array.from(effectiveTools).slice(0, 3);

  for (const toolId of toolCandidates) {
    try {
      assertAllowedTool(Array.from(effectiveTools), toolId);
      const { executeAiTool } = await import("@/services/ai-tools.service");
      const toolInput =
        toolId === "knowledge.search" || toolId === "knowledge.build_context"
          ? { query: prompt, limit: 3, agentId: input.agentRecordId }
          : {};
      const result = await executeAiTool(platform, {
        toolId,
        input: toolInput,
        agentId: input.agentRecordId,
        dryRun: true,
      });

      toolCalls += 1;
      toolOutputs.push({ toolId, output: result.output });
    } catch {
      // Optional tool enrichment should not fail the agent run.
    }
  }

  const goalsSummary = input.profile.goals.join(", ");
  const response = [
    input.profile.personality ? `Persona: ${input.profile.personality}` : null,
    goalsSummary ? `Goals: ${goalsSummary}` : null,
    `Decision: proceed with ${prompt.slice(0, 120)}`,
  ]
    .filter(Boolean)
    .join(". ");

  const tokensUsed = Math.min(
    input.profile.tokenLimit,
    120 + knowledge.citations.length * 20 + toolCalls * 30,
  );
  const costCents = Math.ceil(tokensUsed * 0.002);

  return {
    response,
    structuredOutput: {
      response,
      confidenceScore: knowledge.confidenceScore,
      knowledgeAuditId: knowledge.auditId,
      citations: knowledge.citations,
      toolOutputs,
      memoryContext,
      behaviourRules: input.profile.behaviourRules,
    },
    tokensUsed,
    costCents,
    knowledgeHits: knowledge.citations.length,
    toolCalls,
    automationRuns: 0,
  };
}
