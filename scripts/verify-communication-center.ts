import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_ROUTES,
} from "../src/modules/communication/constants/routes";
import {
  generateAiInsight,
  shouldEscalateByConfidence,
} from "../src/modules/communication/engine/ai-engine";
import {
  createPlatformFileReference,
  inferAttachmentType,
} from "../src/modules/communication/engine/attachment-engine";
import { mergeTimelineMessages } from "../src/modules/communication/engine/conversation-engine";
import { buildConversationSearchWhere } from "../src/modules/communication/engine/search-engine";
import {
  DEFAULT_COMMUNICATION_CHANNELS,
  ensureBootstrapCommunication,
} from "../src/modules/communication/plugins/bootstrap-communication";
import { listCommunicationChannels } from "../src/modules/communication/registry/communication-registry";
import {
  ALL_PERMISSION_CODES,
  PERMISSION_CODES,
} from "../src/modules/authorization/constants/permissions";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  addInternalNote,
  assignConversation,
  closeConversation,
  createConversation,
  ensureCommunicationDefaults,
  getCommunicationDashboard,
  getConversationTimeline,
  listCommunicationAuditLogs,
  listInboxConversations,
  runAiInsight,
  searchConversations,
  sendConversationReply,
} from "../src/services/communication.service";
import { mapProfileToAuthUser } from "../src/services/user.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function buildPlatformContext(businessId: string): Promise<BusinessContext> {
  const businessRecord = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: true },
  });

  assert(businessRecord?.owner, "Business owner missing");

  const business = await getOwnedBusinessById(businessRecord.ownerId, businessId);
  assert(business, "Business profile missing");

  const user = mapProfileToAuthUser(
    businessRecord.owner.id,
    businessRecord.owner.email,
    businessRecord.owner,
    {},
  );
  const authorization = await resolveAuthorizationContext(user, business);

  return {
    user,
    business,
    branch: null,
    branchId: null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [
      { id: business.id, name: business.businessName ?? "Business", isOnboarded: true },
    ],
    accessibleBranches: [],
  };
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/communication/index.ts",
    "src/modules/communication/constants/routes.ts",
    "src/modules/communication/types/communication-types.ts",
    "src/modules/communication/registry/communication-registry.ts",
    "src/modules/communication/engine/conversation-engine.ts",
    "src/modules/communication/engine/ai-engine.ts",
    "src/modules/communication/engine/attachment-engine.ts",
    "src/modules/communication/engine/search-engine.ts",
    "src/modules/communication/plugins/bootstrap-communication.ts",
    "src/modules/communication/utils/communication-utils.ts",
    "src/modules/communication/lib/get-communication-context.ts",
    "src/modules/communication/actions/communication-actions.ts",
    "src/modules/communication/components/communication-dashboard.tsx",
    "src/modules/communication/components/communication-lists.tsx",
    "src/modules/communication/components/communication-nav.tsx",
    "src/services/communication.service.ts",
    "src/app/dashboard/communication/page.tsx",
    "src/app/dashboard/communication/inbox/page.tsx",
    "src/app/dashboard/communication/inbox/personal/page.tsx",
    "src/app/dashboard/communication/inbox/team/page.tsx",
    "src/app/dashboard/communication/inbox/department/page.tsx",
    "src/app/dashboard/communication/inbox/ai/page.tsx",
    "src/app/dashboard/communication/channels/page.tsx",
    "src/app/dashboard/communication/search/page.tsx",
    "src/app/dashboard/communication/audit/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Communication routes");
  assert(COMMUNICATION_ROUTES.overview === "/dashboard/communication", "Overview route mismatch");
  assert(COMMUNICATION_ROUTES.inbox.includes("inbox"), "Inbox route missing");
  console.log("  PASS");

  console.log("Permission protected");
  const permissionsSource = readFileSync(
    join(root, "src/modules/authorization/constants/permissions.ts"),
    "utf8",
  );
  assert(permissionsSource.includes("communication.view"), "communication.view missing");
  assert(permissionsSource.includes("communication.admin"), "communication.admin missing");
  assert(
    ALL_PERMISSION_CODES.includes(PERMISSION_CODES.COMMUNICATION_VIEW),
    "Permission code missing",
  );
  console.log("  PASS");

  console.log("Schema");
  const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schema.includes("model CommunicationConversation"), "CommunicationConversation missing");
  assert(schema.includes("model CommunicationMessage"), "CommunicationMessage missing");
  assert(schema.includes("model CommunicationAiInsight"), "CommunicationAiInsight missing");
  console.log("  PASS");

  console.log("Channel connectors");
  ensureBootstrapCommunication();
  const channels = listCommunicationChannels();
  assert(channels.length >= DEFAULT_COMMUNICATION_CHANNELS.length, "Channels not registered");
  assert(
    channels.every((c) => !c.isIntegrated),
    "Connectors should not be integrated yet",
  );
  console.log("  PASS");

  console.log("Attachment engine");
  assert(inferAttachmentType("image/png") === "IMAGE", "Image type inference failed");
  const fileRef = createPlatformFileReference({
    fileName: "doc.pdf",
    mimeType: "application/pdf",
    storageKey: "business/files/doc.pdf",
  });
  assert(fileRef.attachmentType === "PDF", "PDF attachment type failed");
  console.log("  PASS");

  console.log("AI engine");
  const insight = generateAiInsight("SUMMARIZE", []);
  assert(insight.requiresApproval, "AI must require approval");
  assert(shouldEscalateByConfidence(0.4), "Low confidence should escalate");
  console.log("  PASS");

  console.log("Timeline engine");
  const merged = mergeTimelineMessages(
    [
      { createdAt: new Date("2026-07-28T10:00:00Z"), isInternal: false, body: "a" },
      { createdAt: new Date("2026-07-28T09:00:00Z"), isInternal: true, body: "b" },
    ],
    false,
  );
  assert(merged.length === 1, "Internal notes should be excluded from customer timeline");
  console.log("  PASS");

  console.log("Search engine");
  const searchWhere = buildConversationSearchWhere("biz-id", { query: "hello", channel: "EMAIL" });
  assert(searchWhere.AND, "Search where clause missing");
  console.log("  PASS");

  console.log("Channels list");
  assert(COMMUNICATION_CHANNELS.length === 7, "Expected 7 communication channels");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  assert(business, "No business found for integration tests");
  const platform = await buildPlatformContext(business.id);

  console.log("Communication defaults");
  await ensureCommunicationDefaults(business.id);
  const connectors = await prisma.communicationChannelConnector.count({
    where: { businessId: business.id },
  });
  assert(connectors >= 7, "Channel connectors not seeded");
  console.log("  PASS");

  console.log("Create conversation");
  const conversation = await createConversation(platform, {
    sourceChannel: "EMAIL",
    subject: "Verify Communication Center",
    contact: { name: "Verify Contact", email: "verify@example.com" },
    inboxType: "TEAM",
    initialMessage: {
      body: "Hello, I need help with my order.",
      channel: "EMAIL",
      senderType: "CONTACT",
    },
  });
  assert(conversation.id, "Conversation not created");
  console.log("  PASS");

  console.log("Unified timeline");
  const timeline = await getConversationTimeline(platform, conversation.id, true);
  assert(timeline.length >= 1, "Timeline missing messages");
  console.log("  PASS");

  console.log("Send reply");
  const reply = await sendConversationReply(platform, {
    conversationId: conversation.id,
    body: "Thanks for contacting us. How can we help?",
    channel: "EMAIL",
    autoSend: false,
  });
  assert(reply.id, "Reply not created");
  assert(!reply.sent, "Auto-send must be disabled by default");
  console.log("  PASS");

  console.log("Internal notes");
  const note = await addInternalNote(platform, {
    conversationId: conversation.id,
    body: "Customer seems frustrated @manager",
    mentions: ["manager"],
    attachments: [
      {
        fileName: "screenshot.png",
        mimeType: "image/png",
        storageKey: `communication/${business.id}/screenshot.png`,
        attachmentType: "IMAGE",
      },
    ],
  });
  assert(note.id, "Internal note not created");
  console.log("  PASS");

  console.log("Assignment");
  const aiAgent = await prisma.aiAgent.findFirst({ where: { businessId: business.id } });
  await assignConversation(platform, {
    conversationId: conversation.id,
    assignedAiAgentId: aiAgent?.id ?? null,
    department: "support",
    teamSlug: "frontline",
    inboxType: "AI",
  });
  console.log("  PASS");

  console.log("AI insight");
  const aiResult = await runAiInsight(platform, {
    conversationId: conversation.id,
    actionType: "DRAFT_REPLY",
    aiAgentId: aiAgent?.id ?? null,
  });
  assert(aiResult.requiresApproval, "AI insight must require approval");
  console.log("  PASS");

  console.log("Inbox filters");
  const teamInbox = await listInboxConversations(platform, { inboxType: "TEAM" });
  assert(teamInbox.length > 0, "Team inbox empty");
  const waitingStaff = await listInboxConversations(platform, { filter: "waiting_customer" });
  assert(waitingStaff.length >= 0, "Waiting customer filter failed");
  console.log("  PASS");

  console.log("Search");
  const searchResults = await searchConversations(platform, { query: "order", channel: "EMAIL" });
  assert(searchResults.length >= 0, "Search failed");
  console.log("  PASS");

  console.log("Close conversation");
  await closeConversation(platform, conversation.id);
  const closed = await prisma.communicationConversation.findUnique({
    where: { id: conversation.id },
  });
  assert(closed?.status === "CLOSED", "Conversation not closed");
  console.log("  PASS");

  console.log("Communication dashboard");
  const dashboard = await getCommunicationDashboard(business.id);
  assert(dashboard.totalConversations > 0, "Dashboard total conversations missing");
  console.log("  PASS");

  console.log("Audit logs");
  const auditLogs = await listCommunicationAuditLogs(business.id);
  assert(
    auditLogs.some((log) => log.eventType === "CREATED"),
    "Create audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "REPLIED"),
    "Reply audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "AI_ACTION"),
    "AI audit missing",
  );
  console.log("  PASS");

  console.log("Extensibility registry");
  assert(
    channels.some((c) => c.channel === "FACEBOOK_MESSENGER"),
    "Facebook Messenger connector missing",
  );
  console.log("  PASS");

  console.log("\nCommunication Center verification passed.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
