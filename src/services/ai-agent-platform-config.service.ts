import "server-only";

/** Non-inference service — no parallel AI execution. */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getPlatformAgent } from "@/services/ai-agent-platform-manager.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

export async function getAgentConfiguration(
  ownerId: string,
  agentId: string,
): Promise<Record<string, unknown>> {
  const agent = await getPlatformAgent(ownerId, agentId);
  return agent.configuration;
}

export async function updateAgentConfiguration(
  ownerId: string,
  agentId: string,
  configuration: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aIAgent.findFirst({ where: { id: agentId, businessId } });
  if (!existing) throw new Error("Agent not found");

  await prisma.aIAgent.update({
    where: { id: agentId },
    data: { configuration: configuration as Prisma.InputJsonValue },
  });

  return configuration;
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}
