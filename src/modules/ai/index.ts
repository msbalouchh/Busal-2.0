export {
  BUILTIN_AGENT_SLUGS,
  BUILTIN_AGENT_LABELS,
  ALL_BUILTIN_AGENT_SLUGS,
  type BuiltinAgentSlug,
} from "@/modules/ai/constants/agent-slugs";
export {
  MEMORY_TYPES,
  MEMORY_TYPE_LABELS,
  ALL_MEMORY_TYPES,
  type MemoryType,
} from "@/modules/ai/constants/memory-types";
export {
  TOOL_CATEGORIES,
  TOOL_CATEGORY_LABELS,
  ALL_TOOL_CATEGORIES,
  type ToolCategory,
} from "@/modules/ai/constants/tool-categories";
export {
  AI_INTEGRATION_POINTS,
  type AiIntegrationPoint,
} from "@/modules/ai/constants/integration-points";
export {
  DEFAULT_MOCK_AI_USER_ID,
  DEFAULT_MOCK_AI_SCOPE,
  MOCK_AI_MEMORY_ENTRIES,
  MOCK_AI_RESPONSES,
} from "@/modules/ai/constants/mock-data";

export type * from "@/modules/ai/types";

export { BUILTIN_AGENTS } from "@/modules/ai/agents";
export { BUILTIN_TOOLS } from "@/modules/ai/tools";

export {
  AIAgentRegistry,
  aiAgentRegistry,
  registerAgent,
  getAgent,
  listAgents,
} from "@/modules/ai/registry/agent-registry";
export {
  ToolRegistry,
  toolRegistry,
  registerTool,
  listTools,
} from "@/modules/ai/registry/tool-registry";

/** @deprecated Use `@/modules/ai-engine` — production memory via aiMemoryManager. */
export { MemoryEngine, memoryEngine } from "@/modules/ai/memory/memory-engine";
/** @deprecated Use `@/modules/ai-engine` — production prompts via aiPromptManager. */
export { PromptEngine, promptEngine } from "@/modules/ai/prompts/prompt-engine";

export {
  AIConversationManager,
  aiConversationManager,
} from "@/modules/ai/services/conversation-manager";
export { AIActionExecutor, aiActionExecutor } from "@/modules/ai/services/action-executor";
export {
  AIResponsePipeline,
  createResponsePipeline,
} from "@/modules/ai/services/response-pipeline";
/** @deprecated Dev/test fixtures — production uses ai-engine context injection. */
export {
  buildAiRuntimeContext,
  buildAiPlatformContext,
  buildAiPlatformSnapshot,
  getDefaultAiPlatformSnapshot,
  type AiPlatformSnapshot,
  type AiPlatformInput,
} from "@/modules/ai/services/mock-ai.service";

export { AIOrchestrator, aiOrchestrator } from "@/modules/ai/orchestrator/ai-orchestrator";
export type {
  OrchestratorRunInput,
  OrchestratorRunResult,
} from "@/modules/ai/orchestrator/ai-orchestrator";

/** @deprecated Use `@/modules/ai-engine` aiProviderManager. */
export { LocalAiProvider, localAiProvider } from "@/modules/ai/providers/local-ai-provider";
export { AIContextProvider } from "@/modules/ai/providers/ai-context-provider";

export { AiContext } from "@/modules/ai/contexts/ai-context";

export { useAi, useAiContext } from "@/modules/ai/hooks/use-ai";
export { useAiAgent } from "@/modules/ai/hooks/use-ai-agent";
export { useAiConversation } from "@/modules/ai/hooks/use-ai-conversation";
export { useAiMemory } from "@/modules/ai/hooks/use-ai-memory";

export { AiAgentBadge } from "@/modules/ai/components/ai-agent-badge";
export { AiAssistantPanel } from "@/modules/ai/components/ai-assistant-panel";

export { createAiId, truncateForMemory } from "@/modules/ai/utils/ai-utils";
