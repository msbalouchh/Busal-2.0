import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { detectVoiceIntent } from "../src/services/ai-voice-intent-routing.service";
import {
  getVoiceAgentDashboardStats,
  getVoiceAnalyticsSnapshot,
} from "../src/services/ai-voice-analytics.service";
import { processVoiceCommand } from "../src/services/ai-voice-command.service";
import {
  startVoiceSession,
  updateVoiceSessionStatus,
} from "../src/services/ai-voice-session.service";
import { getVoiceProviderManager } from "../src/services/voice-provider-manager.service";
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
  console.log("AI Voice Agent module structure");
  const moduleFiles = [
    "src/modules/ai-voice-agent-management/index.ts",
    "src/modules/ai-voice-agent-management/constants/routes.ts",
    "src/modules/ai-voice-agent-management/types/ai-voice-agent-types.ts",
    "src/modules/ai-voice-agent-management/lib/get-ai-voice-agent-context.ts",
    "src/modules/ai-voice-agent-management/lib/ai-voice-agent-validation.ts",
    "src/modules/ai-voice-agent-management/actions/ai-voice-agent-actions.ts",
    "src/services/voice/speech-provider.interface.ts",
    "src/services/voice-provider-manager.service.ts",
    "src/services/ai-voice-context.service.ts",
    "src/services/ai-voice-agent-permission.service.ts",
    "src/services/ai-voice-session.service.ts",
    "src/services/ai-voice-command.service.ts",
    "src/services/ai-voice-intent-routing.service.ts",
    "src/services/ai-voice-analytics.service.ts",
    "src/app/app/ai/voice/page.tsx",
    "src/app/app/ai/voice/sessions/page.tsx",
    "src/app/app/ai/voice/sessions/[sessionId]/page.tsx",
    "src/app/app/ai/voice/commands/page.tsx",
    "src/app/app/ai/voice/analytics/page.tsx",
    "src/app/app/ai/voice/settings/page.tsx",
    "src/app/app/ai/voice/search/page.tsx",
    "prisma/migrations/20250731140000_ai_voice_agent/migration.sql",
    "prisma/migrations/20250731140100_ai_voice_agent_permissions/migration.sql",
  ];

  for (const file of moduleFiles) {
    read(file);
  }

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.AI_VOICE_VIEW), "AI_VOICE_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.AI_VOICE_EXECUTE), "AI_VOICE_EXECUTE missing");
  assert(permissions.includes(PERMISSION_CODES.AI_VOICE_MANAGE), "AI_VOICE_MANAGE missing");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model AIVoiceSession"), "AIVoiceSession model missing");
  assert(schema.includes("model AIVoiceCommand"), "AIVoiceCommand model missing");

  const intent = detectVoiceIntent("Show today's sales");
  assert(intent.intent === "show_today_sales", "Intent detection failed");

  const providerManager = getVoiceProviderManager();
  assert(providerManager.getSttProvider().providerId === "noop-stt", "STT provider missing");
  assert(providerManager.getTtsProvider().providerId === "noop-tts", "TTS provider missing");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found for integration test");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  const stats = await getVoiceAgentDashboardStats(ownerId);
  assert(typeof stats.totalSessions === "number", "Dashboard stats failed");

  const analytics = await getVoiceAnalyticsSnapshot(ownerId);
  assert(typeof analytics.successRate === "number", "Analytics snapshot failed");

  const session = await startVoiceSession(ownerId, { language: "en" });
  assert(session.id, "Voice session creation failed");

  const result = await processVoiceCommand(ownerId, session.id, "Open reservations");
  assert(result.command.status === "PROCESSED", "Voice command processing failed");

  await updateVoiceSessionStatus(ownerId, session.id, "COMPLETED");

  console.log("AI Voice Agent verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
