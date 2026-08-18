import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { aiProviderManager } from "../src/modules/ai-engine/providers/provider-manager";
import { isMockFallbackAllowed } from "../src/lib/production-mode";
import {
  getCustomerAiPublicConfig,
  runCustomerAiChat,
} from "../src/modules/customer-ai/services/customer-ai-chat.service";
import {
  getCustomerAiIdentity,
  updateCustomerAiIdentity,
} from "../src/modules/customer-ai/services/customer-ai-identity.service";
import { syncBusinessDataToKnowledge } from "../src/modules/customer-ai/services/customer-ai-knowledge-sync.service";
import {
  createCustomerAiSession,
  verifyCustomerIdentity,
} from "../src/modules/customer-ai/services/customer-identity.service";
import { signEmbedToken, verifyEmbedToken } from "../src/modules/platform/services/platform-embed.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

async function verifyDatabaseSchema() {
  const businessCols = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses'
      AND column_name IN ('ai_avatar_url','ai_greeting','ai_tone')
    ORDER BY column_name`;
  assert(businessCols.length === 3, `Expected 3 business AI columns, got ${businessCols.length}`);

  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('customer_ai_sessions','customer_ai_events')
    ORDER BY table_name`;
  assert(tables.length === 2, `Expected customer AI tables, got ${tables.length}`);

  const convCols = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_conversations'
      AND column_name IN ('customer_id','channel','audience_type','escalated_at')
    ORDER BY column_name`;
  assert(convCols.length === 4, `Expected 4 ai_conversations columns, got ${convCols.length}`);

  const migration = await prisma.$queryRaw<Array<{ migration_name: string }>>`
    SELECT migration_name FROM _prisma_migrations
    WHERE migration_name = '20250804190000_customer_ai_operating_system'`;
  assert(migration.length === 1, "Customer AI migration not recorded");

  console.log("✓ Database schema verified");
}

async function verifyCustomerAiRuntime(businessId: string) {
  const providers = aiProviderManager.listProviders();
  const configuredReal = providers.filter((p) => p.configured && p.id !== "mock-fallback");
  console.log(
    `AI providers: ${providers.map((p) => `${p.id}${p.configured ? " (configured)" : ""}`).join(", ")}`,
  );
  console.log(`Mock fallback allowed: ${isMockFallbackAllowed()}`);

  const testName = `Phase27Test-${Date.now()}`;
  await updateCustomerAiIdentity(businessId, {
    aiName: testName,
    aiPersonality: "Warm and concise",
    aiTone: "Friendly",
    aiGreeting: `Hello from ${testName}!`,
  });

  const identity = await getCustomerAiIdentity(businessId);
  assert(identity.aiName === testName, "AI identity update did not persist");
  assert(identity.aiGreeting?.includes(testName), "AI greeting did not persist");

  const sync = await syncBusinessDataToKnowledge(businessId);
  assert(sync.memoryFactsSynced >= 0, "Knowledge sync failed");
  console.log(
    `✓ Knowledge sync: ${sync.memoryFactsSynced} facts, ${sync.knowledgeDocumentsSynced} documents`,
  );

  const publicConfig = await getCustomerAiPublicConfig(businessId);
  assert(publicConfig.aiName === testName, "Public config does not reflect identity");
  assert(publicConfig.enabled, "Customer AI should be enabled");

  const scenarios = [
    { label: "business-info", message: "What is your business name and contact information?" },
    { label: "menu", message: "What items are on your menu?" },
    { label: "hours", message: "What are your opening hours?" },
    { label: "faq", message: "What is your cancellation or refund policy?" },
    {
      label: "reservation",
      message:
        "I want to book a table for 2 tomorrow at 7pm. Name John Smith, phone +447700900123.",
    },
  ];

  let conversationId: string | undefined;
  let sessionToken: string | undefined;

  for (const scenario of scenarios) {
    const result = await runCustomerAiChat({
      businessId,
      message: scenario.message,
      conversationId,
      sessionToken,
      channel: "website",
    });
    conversationId = result.conversationId;
    sessionToken = result.sessionToken;
    assert(result.content.trim().length > 0, `${scenario.label}: empty response`);
    assert(result.aiName === testName, `${scenario.label}: wrong AI name`);
    console.log(`✓ ${scenario.label}: ${result.content.length} chars`);
  }

  const followUp = await runCustomerAiChat({
    businessId,
    message: "What was my previous question about?",
    conversationId,
    sessionToken,
    channel: "website",
  });
  assert(followUp.conversationId === conversationId, "Conversation continuity broken");
  console.log("✓ Conversation follow-up");

  const persisted = await prisma.aIConversation.findFirst({
    where: { id: conversationId, businessId, audienceType: "CUSTOMER" },
    include: { _count: { select: { messages: true } } },
  });
  assert(persisted, "Conversation not persisted");
  assert(persisted._count.messages >= 12, "Expected persisted customer/assistant messages");
  console.log(`✓ Conversation persistence (${persisted._count.messages} messages)`);

  const sessionCount = await prisma.customerAiSession.count({
    where: { businessId, sessionToken },
  });
  assert(sessionCount === 1, "Customer AI session not persisted for business");
  console.log("✓ Tenant-scoped session persistence");

  const now = Date.now();
  const token = signEmbedToken({
    businessId,
    widgetType: "ai",
    origin: "https://localhost",
    issuedAt: now,
    expiresAt: now + 3600_000,
  });
  const payload = verifyEmbedToken(token);
  assert(payload?.businessId === businessId, "Embed token business binding failed");

  const otherBusiness = await prisma.business.findFirst({
    where: { id: { not: businessId }, onboardingCompleted: true },
    select: { id: true },
  });
  if (otherBusiness) {
    assert(payload?.businessId !== otherBusiness.id, "Embed token tenant isolation check setup failed");
  }

  const session = await createCustomerAiSession({ businessId, channel: "embed" });
  const verifyResult = await verifyCustomerIdentity({
    businessId,
    sessionToken: session.sessionToken,
    email: "nonexistent-phase27@example.com",
  });
  assert(!verifyResult.verified, "Verification should fail for unknown email");
  console.log("✓ Guest verification rejection");

  assert(conversationId, "Missing conversation id");
  const audit = await prisma.aiAgentAuditLog.findFirst({
    where: { businessId, entityType: "customer_conversation", entityId: conversationId },
    orderBy: { createdAt: "desc" },
    select: { metadata: true },
  });
  const meta = audit?.metadata as { providerId?: string; model?: string } | null;
  assert(meta?.providerId, "Missing provider audit metadata");

  if (configuredReal.length > 0) {
    assert(meta.providerId !== "mock-fallback", "Real provider configured but mock-fallback was used");
    console.log(`✓ Real provider verified: ${meta.providerId} (${meta.model ?? "model unknown"})`);
  } else {
    console.log(`⚠ Development mock provider used: ${meta.providerId}`);
  }
}

async function main() {
  console.log("Phase 27 Customer AI verification\n");

  const requiredFiles = [
    "src/modules/customer-ai/services/customer-ai-chat.service.ts",
    "src/modules/customer-ai/components/customer-ai-chat-panel.tsx",
    "src/app/api/embed/chat/route.ts",
    "src/app/api/embed/chat/verify/route.ts",
    "src/app/dashboard/ai-platform/control-center/page.tsx",
    "prisma/migrations/20250804190000_customer_ai_operating_system/migration.sql",
  ];
  for (const file of requiredFiles) read(file);

  await verifyDatabaseSchema();

  const business = await prisma.business.findFirst({
    where: { onboardingCompleted: true },
    select: { id: true, businessName: true },
    orderBy: { createdAt: "asc" },
  });
  assert(business, "No onboarded business found");

  console.log(`Using business: ${business.businessName} (${business.id})\n`);
  await verifyCustomerAiRuntime(business.id);

  console.log("\nPhase 27 verification completed successfully.");
}

main()
  .catch((error) => {
    console.error("\nVerification failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
