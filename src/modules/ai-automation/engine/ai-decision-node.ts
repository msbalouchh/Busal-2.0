import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type {
  AiDecisionResult,
  WorkflowExecutionContext,
  WorkflowNode,
} from "@/modules/ai-automation/types/automation-types";

export async function runAiDecisionNode(
  platform: BusinessContext,
  node: WorkflowNode,
  context: WorkflowExecutionContext,
): Promise<AiDecisionResult> {
  const prompt =
    typeof node.config.prompt === "string"
      ? node.config.prompt
      : "Analyse the event and recommend the next action.";

  const { retrieveKnowledge } = await import("@/services/ai-knowledge.service");
  const knowledge = await retrieveKnowledge(platform, prompt, {
    limit: 3,
    agentId: "automation-decision",
  });

  const toolId = typeof node.config.toolId === "string" ? node.config.toolId : "knowledge.search";
  let toolOutput: Record<string, unknown> | null = null;
  let toolError: string | null = null;

  if (node.config.useTools !== false) {
    try {
      const { executeAiTool } = await import("@/services/ai-tools.service");
      const toolInput =
        toolId === "knowledge.search" || toolId === "knowledge.build_context"
          ? { query: prompt, limit: 3, agentId: "automation-decision" }
          : {};
      const toolResult = await executeAiTool(platform, {
        toolId,
        input: toolInput,
        agentId: "automation-decision",
        dryRun: true,
      });

      toolOutput = toolResult.output;
    } catch (error) {
      toolError = error instanceof Error ? error.message : "Tool execution failed";
    }
  }

  const eventSummary = JSON.stringify(context.eventPayload).slice(0, 500);
  const decision =
    typeof node.config.defaultDecision === "string" ? node.config.defaultDecision : "proceed";

  const confidenceScore = Math.min(
    0.95,
    Math.max(0.4, knowledge.confidenceScore + (toolOutput ? 0.1 : 0) - (toolError ? 0.05 : 0)),
  );

  const reasoningParts = [
    `Knowledge context retrieved (${knowledge.citations.length} citations).`,
    toolOutput ? "Tool enrichment succeeded." : null,
    toolError ? `Tool enrichment skipped: ${toolError}` : null,
    `Event summary: ${eventSummary}`,
  ].filter(Boolean);

  return {
    decision,
    confidenceScore,
    reasoning: reasoningParts.join(" "),
    structuredOutput: {
      decision,
      knowledgeAuditId: knowledge.auditId,
      toolId,
      toolOutput,
      toolError,
      citations: knowledge.citations.map((citation) => ({
        documentTitle: citation.documentTitle,
        score: citation.score,
      })),
    },
  };
}
