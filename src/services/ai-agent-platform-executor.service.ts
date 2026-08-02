import "server-only";

import type { Prisma } from "@prisma/client";

import { ensurePlatformAiProviders } from "@/modules/ai-agent-platform-management/engine/bootstrap-platform-providers";
import { getPlatformAiProvider } from "@/modules/ai-agent-platform-management/engine/platform-provider-registry";
import type { IAIAgent } from "@/modules/ai-agent-platform-management/interfaces/ai-agent.interface";
import type { IAIContext } from "@/modules/ai-agent-platform-management/interfaces/ai-context.interface";
import type { IAIExecutor } from "@/modules/ai-agent-platform-management/interfaces/ai-executor.interface";
import type { IAIResponse } from "@/modules/ai-agent-platform-management/interfaces/ai-response.interface";
import { prisma } from "@/lib/prisma";
import type {
  ExecuteAgentInput,
  PlatformAgentExecutionRecord,
} from "@/modules/ai-agent-platform-management/types/ai-agent-platform-types";
import {
  loadPlatformAgent,
  loadPlatformAgentContext,
} from "@/services/ai-agent-platform-loader.service";
import { getPlatformAgent } from "@/services/ai-agent-platform-manager.service";
import { assertAgentExecutionPermission } from "@/services/ai-agent-platform-permission.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

class PlatformAgentExecutor implements IAIExecutor {
  async execute(
    agent: IAIAgent,
    context: IAIContext,
    input: Record<string, unknown>,
  ): Promise<IAIResponse> {
    await agent.initialize(context);
    return agent.execute(context, input);
  }
}

const executor = new PlatformAgentExecutor();

async function resolveStaffId(userId: string, businessId: string): Promise<string | null> {
  const staff = await prisma.staff.findFirst({
    where: { userId, businessId, isActive: true },
    select: { id: true },
  });
  return staff?.id ?? null;
}

export async function executePlatformAgent(
  ownerId: string,
  permissions: Set<string>,
  input: ExecuteAgentInput,
  isOwner = false,
): Promise<PlatformAgentExecutionRecord> {
  ensurePlatformAiProviders();
  const record = await getPlatformAgent(ownerId, input.agentId);
  assertAgentExecutionPermission(permissions, record, isOwner);

  if (record.status !== "ACTIVE") {
    throw new Error("Agent must be active to execute");
  }

  const businessId = await getOwnedBusinessId(ownerId);
  const staffId = await resolveStaffId(ownerId, businessId);
  const startedAt = new Date();

  const execution = await prisma.aIAgentExecution.create({
    data: {
      agentId: input.agentId,
      businessId,
      staffId,
      status: "RUNNING",
      startedAt,
      input: (input.input ?? {}) as Prisma.InputJsonValue,
    },
  });

  try {
    const agent = await loadPlatformAgent(input.agentId, ownerId);
    const context = await loadPlatformAgentContext(input.agentId, ownerId, permissions);

    let response: IAIResponse;
    if (agent) {
      response = await executor.execute(agent, context, input.input ?? {});
    } else {
      const provider = getPlatformAiProvider();
      const providerResponse = await provider.complete({
        systemPrompt: `You are ${record.name}, a Busal AI agent.`,
        messages: [{ role: "user", content: JSON.stringify(input.input ?? {}) }],
      });
      response = { content: providerResponse.content, metadata: { provider: provider.id } };
    }

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const updated = await prisma.aIAgentExecution.update({
      where: { id: execution.id },
      data: {
        status: "COMPLETED",
        completedAt,
        duration,
        output: {
          content: response.content,
          metadata: response.metadata ?? {},
          toolResults: response.toolResults ?? [],
        } as Prisma.InputJsonValue,
      },
    });

    return serializeExecution(updated, record.name);
  } catch (error) {
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();
    const message = error instanceof Error ? error.message : "Execution failed";

    const updated = await prisma.aIAgentExecution.update({
      where: { id: execution.id },
      data: {
        status: "FAILED",
        completedAt,
        duration,
        error: message,
      },
    });

    return serializeExecution(updated, record.name);
  }
}

export async function listPlatformAgentExecutions(
  ownerId: string,
  agentId?: string,
  limit = 50,
): Promise<PlatformAgentExecutionRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);

  const executions = await prisma.aIAgentExecution.findMany({
    where: {
      businessId,
      ...(agentId ? { agentId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { agent: { select: { name: true } } },
  });

  return executions.map((execution) => serializeExecution(execution, execution.agent.name));
}

function serializeExecution(
  execution: {
    id: string;
    agentId: string;
    businessId: string;
    staffId: string | null;
    status: PlatformAgentExecutionRecord["status"];
    startedAt: Date | null;
    completedAt: Date | null;
    duration: number | null;
    input: Prisma.JsonValue;
    output: Prisma.JsonValue;
    error: string | null;
    metadata: Prisma.JsonValue;
    createdAt: Date;
  },
  agentName?: string,
): PlatformAgentExecutionRecord {
  return {
    id: execution.id,
    agentId: execution.agentId,
    businessId: execution.businessId,
    staffId: execution.staffId,
    status: execution.status,
    startedAt: execution.startedAt?.toISOString() ?? null,
    completedAt: execution.completedAt?.toISOString() ?? null,
    duration: execution.duration,
    input: (execution.input as Record<string, unknown>) ?? {},
    output: (execution.output as Record<string, unknown>) ?? {},
    error: execution.error,
    metadata: (execution.metadata as Record<string, unknown>) ?? {},
    createdAt: execution.createdAt.toISOString(),
    agentName,
  };
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}
