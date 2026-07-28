import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeAiTool,
  serializeAiToolExecution,
  serializeAiToolsDashboard,
} from "@/modules/ai-tools/utils/ai-tools-utils";
import {
  discoverAvailableAiTools,
  listAiToolExecutions,
  listAiTools,
} from "@/services/ai-tools.service";

export const getAiToolsOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_TOOL_EXECUTE });
  const [tools, executions] = await Promise.all([
    listAiTools(context.business.id),
    listAiToolExecutions(context.business.id, 10),
  ]);

  return {
    context,
    dashboard: serializeAiToolsDashboard({ tools, executions }),
    recentExecutions: executions.map(serializeAiToolExecution),
  };
});

export const getAiToolsRegistryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_TOOL_EXECUTE });
  const tools = await listAiTools(context.business.id);

  return {
    context,
    tools: tools.map(serializeAiTool),
  };
});

export const getAiToolsExecutionsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_TOOL_EXECUTE });
  const executions = await listAiToolExecutions(context.business.id, 100);

  return {
    context,
    executions: executions.map(serializeAiToolExecution),
  };
});

export const getAiToolsDiscoveryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_TOOL_EXECUTE });
  const discovered = await discoverAvailableAiTools(context);

  return {
    context,
    discovered,
  };
});
