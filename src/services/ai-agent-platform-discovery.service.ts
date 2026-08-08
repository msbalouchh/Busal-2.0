import "server-only";

/** Non-inference service — no parallel AI execution. */

import type { AgentCategory } from "@prisma/client";

import { discoverRegisteredAgents } from "@/modules/ai-agent-platform-management/engine/agent-registry";
import { prisma } from "@/lib/prisma";
import type { AgentDiscoveryEntry } from "@/modules/ai-agent-platform-management/types/ai-agent-platform-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

export async function discoverPlatformAgents(
  ownerId: string,
  filters?: { category?: AgentCategory; search?: string },
): Promise<AgentDiscoveryEntry[]> {
  const businessId = await getOwnedBusinessId(ownerId);

  const [dbAgents, registeredAgents] = await Promise.all([
    prisma.aIAgent.findMany({
      where: {
        businessId,
        status: { not: "ARCHIVED" },
        ...(filters?.category ? { category: filters.category } : {}),
        ...(filters?.search?.trim()
          ? {
              OR: [
                { name: { contains: filters.search.trim(), mode: "insensitive" } },
                { slug: { contains: filters.search.trim(), mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        tools: { where: { enabled: true }, select: { toolKey: true } },
        capabilities: { where: { enabled: true }, select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    Promise.resolve(discoverRegisteredAgents(filters)),
  ]);

  const dbEntries: AgentDiscoveryEntry[] = dbAgents.map((agent) => ({
    slug: agent.slug,
    name: agent.name,
    category: agent.category,
    status: agent.status,
    version: agent.version,
    capabilities: agent.capabilities.map((capability) => capability.name),
    toolKeys: agent.tools.map((tool) => tool.toolKey),
  }));

  const registeredEntries: AgentDiscoveryEntry[] = registeredAgents
    .filter((definition) => !dbEntries.some((entry) => entry.slug === definition.slug))
    .map((definition) => ({
      slug: definition.slug,
      name: definition.name,
      category: definition.category,
      status: "DRAFT",
      version: definition.version,
      capabilities: [],
      toolKeys: [],
    }));

  return [...dbEntries, ...registeredEntries];
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}
