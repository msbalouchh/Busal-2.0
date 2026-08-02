import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { createMemory, getMemory } from "../src/services/ai-memory.service";
import {
  createMemoryCollection,
  getMemoryDashboardStats,
  listMemories,
  listMemoryCollections,
} from "../src/services/ai-memory-manager.service";
import { searchMemories } from "../src/services/ai-memory-search.service";
import { buildMemoryContextBundle } from "../src/services/ai-memory-context-builder.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

async function main() {
  console.log("AI Memory Engine module structure");
  const moduleFiles = [
    "src/modules/ai-memory-management/index.ts",
    "src/modules/ai-memory-management/constants/routes.ts",
    "src/modules/ai-memory-management/types/ai-memory-types.ts",
    "src/modules/ai-memory-management/lib/get-ai-memory-context.ts",
    "src/modules/ai-memory-management/lib/ai-memory-validation.ts",
    "src/modules/ai-memory-management/actions/ai-memory-actions.ts",
    "src/modules/ai-memory-management/engine/memory-engine.ts",
    "src/modules/ai-memory-management/interfaces/memory-provider.interface.ts",
    "src/modules/ai-memory-management/components/memory-dashboard-panel.tsx",
    "src/modules/ai-memory-management/components/memory-explorer-panel.tsx",
    "src/modules/ai-memory-management/components/memory-search-panel.tsx",
    "src/modules/ai-memory-management/components/memory-timeline-panel.tsx",
    "src/modules/ai-memory-management/components/memory-collections-panel.tsx",
    "src/modules/ai-memory-management/components/memory-detail-panel.tsx",
    "src/modules/ai-memory-management/components/memory-analytics-panel.tsx",
    "src/services/ai-memory.service.ts",
    "src/services/ai-memory-manager.service.ts",
    "src/services/ai-memory-search.service.ts",
    "src/services/ai-memory-index.service.ts",
    "src/services/ai-memory-ranking.service.ts",
    "src/services/ai-memory-cleanup.service.ts",
    "src/services/ai-memory-retrieval.service.ts",
    "src/services/ai-memory-summarizer.service.ts",
    "src/services/ai-memory-context-builder.service.ts",
    "src/services/ai-memory-permission.service.ts",
    "src/app/app/ai/memory/page.tsx",
    "src/app/app/ai/memory/explorer/page.tsx",
    "src/app/app/ai/memory/search/page.tsx",
    "src/app/app/ai/memory/timeline/page.tsx",
    "src/app/app/ai/memory/collections/page.tsx",
    "src/app/app/ai/memory/analytics/page.tsx",
    "src/app/app/ai/memory/[memoryId]/page.tsx",
    "prisma/migrations/20250731050000_ai_memory_engine/migration.sql",
    "prisma/migrations/20250731050100_ai_memory_engine_permissions/migration.sql",
  ];

  for (const file of moduleFiles) {
    read(file);
  }

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.AI_MEMORY_VIEW), "AI_MEMORY_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.AI_MEMORY_CREATE), "AI_MEMORY_CREATE missing");
  assert(permissions.includes(PERMISSION_CODES.AI_MEMORY_UPDATE), "AI_MEMORY_UPDATE missing");
  assert(permissions.includes(PERMISSION_CODES.AI_MEMORY_DELETE), "AI_MEMORY_DELETE missing");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model AIMemory"), "AIMemory model missing");
  assert(schema.includes("model AIMemoryCollection"), "AIMemoryCollection model missing");
  assert(schema.includes("model AIMemoryReference"), "AIMemoryReference model missing");
  assert(schema.includes("enum MemoryType"), "MemoryType enum missing");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found for integration test");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  const memory = await createMemory(ownerId, {
    memoryType: "BUSINESS",
    title: "Verify memory",
    content: "AI Memory Engine verification record",
    importanceScore: 0.8,
  });
  assert(memory.id, "Memory create failed");

  const loaded = await getMemory(ownerId, memory.id);
  assert(loaded.title === "Verify memory", "Memory retrieval failed");

  const list = await listMemories(ownerId, { search: "Verify memory" });
  assert(
    list.items.some((item: { id: string }) => item.id === memory.id),
    "Memory list failed",
  );

  const search = await searchMemories(ownerId, { search: "verification" });
  assert(search.total >= 1, "Memory search failed");

  const collection = await createMemoryCollection(ownerId, {
    name: `Verify Collection ${Date.now()}`,
    description: "Verification collection",
  });
  assert(collection.id, "Collection create failed");

  const collections = await listMemoryCollections(ownerId);
  assert(
    collections.some((item) => item.id === collection.id),
    "Collection list failed",
  );

  const stats = await getMemoryDashboardStats(ownerId);
  assert(stats.totalMemories >= 1, "Dashboard stats failed");

  const context = await buildMemoryContextBundle(ownerId, {});
  assert(Array.isArray(context.business), "Context builder failed");

  await prisma.aIMemory.delete({ where: { id: memory.id } });
  await prisma.aIMemoryCollection.delete({ where: { id: collection.id } });

  console.log("AI Memory Engine verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
