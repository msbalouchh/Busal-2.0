import "server-only";

import type { AiToolExecutionStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { discoverToolsFromDefinitions } from "@/modules/ai-tools/engine/tool-discovery";
import { runToolExecution } from "@/modules/ai-tools/engine/tool-execution-engine";
import { ensureBootstrapAiTools } from "@/modules/ai-tools/plugins/bootstrap-tools";
import {
  getRegisteredTool,
  listRegisteredTools,
  registerTool as registerPluginTool,
} from "@/modules/ai-tools/registry/tool-registry";
import type {
  DiscoveredTool,
  ExecuteToolRequest,
  ToolDefinition,
  ToolExecutionResult,
  ToolHandler,
} from "@/modules/ai-tools/types/tool-types";

export interface AiToolsDashboardData {
  totalTools: number;
  activeTools: number;
  disabledTools: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  awaitingConfirmation: number;
}

function assertPermission(platform: BusinessContext, permission: string): void {
  if (!platform.permissions.includes(permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

export async function ensureAiToolsRegistered(businessId: string): Promise<void> {
  ensureBootstrapAiTools();

  const definitions = listRegisteredTools();

  for (const definition of definitions) {
    await prisma.aiTool.upsert({
      where: {
        businessId_toolId: {
          businessId,
          toolId: definition.toolId,
        },
      },
      create: {
        businessId,
        toolId: definition.toolId,
        name: definition.name,
        description: definition.description,
        module: definition.module,
        category: definition.category,
        version: definition.version ?? "1.0.0",
        inputSchema: definition.inputSchema as Prisma.InputJsonValue,
        outputSchema: definition.outputSchema as Prisma.InputJsonValue,
        requiredPermissions: definition.requiredPermissions ?? [],
        supportedIndustries: definition.supportedIndustries ?? [],
        riskLevel: definition.riskLevel ?? "STANDARD",
        dryRunSupported: definition.dryRunSupported ?? false,
        confirmationRequired: definition.confirmationRequired ?? false,
        readOnly: definition.readOnly ?? false,
        rollbackCapable: definition.rollbackCapable ?? false,
        status: "ACTIVE",
      },
      update: {
        name: definition.name,
        description: definition.description,
        module: definition.module,
        category: definition.category,
        version: definition.version ?? "1.0.0",
        inputSchema: definition.inputSchema as Prisma.InputJsonValue,
        outputSchema: definition.outputSchema as Prisma.InputJsonValue,
        requiredPermissions: definition.requiredPermissions ?? [],
        supportedIndustries: definition.supportedIndustries ?? [],
        riskLevel: definition.riskLevel ?? "STANDARD",
        dryRunSupported: definition.dryRunSupported ?? false,
        confirmationRequired: definition.confirmationRequired ?? false,
        readOnly: definition.readOnly ?? false,
        rollbackCapable: definition.rollbackCapable ?? false,
      },
    });
  }
}

export async function registerAiToolForBusiness(
  platform: BusinessContext,
  definition: ToolDefinition,
  handler: ToolHandler,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.AI_TOOL_REGISTER);
  registerPluginTool(definition, handler);
  await ensureAiToolsRegistered(platform.business.id);
}

export async function disableAiTool(platform: BusinessContext, toolId: string): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.AI_TOOL_DISABLE);
  await ensureAiToolsRegistered(platform.business.id);

  await prisma.aiTool.updateMany({
    where: {
      businessId: platform.business.id,
      toolId,
    },
    data: {
      status: "DISABLED",
    },
  });
}

export async function enableAiTool(platform: BusinessContext, toolId: string): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.AI_TOOL_ADMIN);
  await ensureAiToolsRegistered(platform.business.id);

  await prisma.aiTool.updateMany({
    where: {
      businessId: platform.business.id,
      toolId,
    },
    data: {
      status: "ACTIVE",
    },
  });
}

export async function listAiTools(businessId: string) {
  await ensureAiToolsRegistered(businessId);

  return prisma.aiTool.findMany({
    where: { businessId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function listAiToolExecutions(businessId: string, limit = 50) {
  return prisma.aiToolExecution.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function discoverAvailableAiTools(
  platform: BusinessContext,
  options: {
    installedModules?: string[];
    category?: Parameters<typeof discoverToolsFromDefinitions>[2]["category"];
  } = {},
): Promise<DiscoveredTool[]> {
  assertPermission(platform, PERMISSION_CODES.AI_TOOL_EXECUTE);
  await ensureAiToolsRegistered(platform.business.id);

  const records = await prisma.aiTool.findMany({
    where: { businessId: platform.business.id },
  });

  return discoverToolsFromDefinitions(listRegisteredTools(), records, {
    permissions: platform.permissions,
    industry: platform.business.businessType,
    installedModules: options.installedModules,
    category: options.category,
  });
}

export async function getAiToolsDashboard(businessId: string): Promise<AiToolsDashboardData> {
  await ensureAiToolsRegistered(businessId);

  const [tools, executions] = await Promise.all([
    prisma.aiTool.findMany({ where: { businessId } }),
    prisma.aiToolExecution.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return {
    totalTools: tools.length,
    activeTools: tools.filter((tool) => tool.status === "ACTIVE").length,
    disabledTools: tools.filter((tool) => tool.status === "DISABLED").length,
    totalExecutions: executions.length,
    successfulExecutions: executions.filter((execution) => execution.status === "SUCCESS").length,
    failedExecutions: executions.filter((execution) => execution.status === "FAILED").length,
    awaitingConfirmation: executions.filter(
      (execution) => execution.status === "AWAITING_CONFIRMATION",
    ).length,
  };
}

export async function executeAiTool(
  platform: BusinessContext,
  request: ExecuteToolRequest,
): Promise<ToolExecutionResult> {
  await ensureAiToolsRegistered(platform.business.id);

  return runToolExecution(platform, request, {
    loadToolRecord: async (businessId, toolId) =>
      prisma.aiTool.findFirst({
        where: { businessId, toolId },
        select: { id: true, status: true, toolId: true },
      }),
    createExecution: async (input) =>
      prisma.aiToolExecution.create({
        data: {
          businessId: input.businessId,
          branchId: input.branchId,
          toolRecordId: input.toolRecordId,
          toolId: input.toolId,
          agentId: input.agentId,
          userId: input.userId,
          staffId: input.staffId,
          input: input.input as Prisma.InputJsonValue,
          status: input.status as AiToolExecutionStatus,
          dryRun: input.dryRun,
          confirmed: input.confirmed,
          parentExecutionId: input.parentExecutionId ?? null,
        },
        select: { id: true },
      }),
    finalizeExecution: async (executionId, input) => {
      await prisma.aiToolExecution.update({
        where: { id: executionId },
        data: {
          status: input.status as AiToolExecutionStatus,
          output: input.output ? (input.output as Prisma.InputJsonValue) : undefined,
          errorDetails: input.errorDetails ?? null,
          executionTimeMs: input.executionTimeMs ?? null,
          tokensUsed: input.tokensUsed ?? null,
          modelUsed: input.modelUsed ?? null,
          retryCount: input.retryCount ?? 0,
        },
      });
    },
  });
}

export function getAiToolDefinition(toolId: string): ToolDefinition | undefined {
  ensureBootstrapAiTools();
  return getRegisteredTool(toolId);
}
