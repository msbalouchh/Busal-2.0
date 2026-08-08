import "server-only";

/** Non-inference service — no parallel AI execution. */

import { getPlatformAgentDefinition } from "@/modules/ai-agent-platform-management/engine/agent-registry";
import { ensurePlatformAiProviders } from "@/modules/ai-agent-platform-management/engine/bootstrap-platform-providers";
import type { IAIAgent } from "@/modules/ai-agent-platform-management/interfaces/ai-agent.interface";
import type { IAIContext } from "@/modules/ai-agent-platform-management/interfaces/ai-context.interface";
import { getPlatformAgent } from "@/services/ai-agent-platform-manager.service";

export async function loadPlatformAgent(
  agentId: string,
  ownerId: string,
): Promise<IAIAgent | null> {
  ensurePlatformAiProviders();
  const record = await getPlatformAgent(ownerId, agentId);
  const definition = getPlatformAgentDefinition(record.slug);
  if (!definition) return null;
  return definition.factory();
}

export async function loadPlatformAgentContext(
  agentId: string,
  ownerId: string,
  permissions: Set<string>,
): Promise<IAIContext> {
  const record = await getPlatformAgent(ownerId, agentId);
  const staffId = await resolveStaffId(ownerId, record.businessId);

  return {
    businessId: record.businessId,
    staffId,
    userId: ownerId,
    agentId: record.id,
    permissions,
  };
}

async function resolveStaffId(userId: string, businessId: string): Promise<string | null> {
  const { prisma } = await import("@/lib/prisma");
  const staff = await prisma.staff.findFirst({
    where: { userId, businessId, isActive: true },
    select: { id: true },
  });
  return staff?.id ?? null;
}
