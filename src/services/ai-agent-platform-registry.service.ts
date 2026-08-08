import "server-only";

/** Non-inference service — no parallel AI execution. */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getPlatformAgentDefinition,
  listPlatformAgentDefinitions,
  registerPlatformAgent,
} from "@/modules/ai-agent-platform-management/engine/agent-registry";
import type { IAIAgentDefinition } from "@/modules/ai-agent-platform-management/interfaces/ai-agent.interface";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

export function registerAgentOnPlatform(definition: IAIAgentDefinition): void {
  registerPlatformAgent(definition);
}

export function listRegisteredPlatformAgents(): IAIAgentDefinition[] {
  return listPlatformAgentDefinitions();
}

export function getRegisteredPlatformAgent(slug: string): IAIAgentDefinition | undefined {
  return getPlatformAgentDefinition(slug);
}

export async function syncRegisteredAgentToDatabase(
  ownerId: string,
  slug: string,
): Promise<string | null> {
  const definition = getPlatformAgentDefinition(slug);
  if (!definition) return null;

  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aIAgent.findFirst({ where: { businessId, slug } });
  if (existing) return existing.id;

  const created = await prisma.aIAgent.create({
    data: {
      businessId,
      name: definition.name,
      slug: definition.slug,
      description: definition.description ?? null,
      category: definition.category,
      status: "DRAFT",
      version: definition.version,
      configuration: {} as Prisma.InputJsonValue,
      permissions: [] as Prisma.InputJsonValue,
    },
  });

  return created.id;
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}
