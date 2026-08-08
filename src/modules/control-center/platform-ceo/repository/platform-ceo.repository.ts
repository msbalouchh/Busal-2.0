import "server-only";

import { randomUUID } from "crypto";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  PlatformCeoAuditEntry,
  PlatformCeoConversation,
  PlatformCeoConversationQuery,
  PlatformCeoMemory,
  PlatformCeoMessage,
} from "@/modules/control-center/platform-ceo/types/platform-ceo.types";
import type {
  ExecutiveReportKind,
  PlatformCeoExecutiveReport,
} from "@/modules/control-center/platform-ceo/types/platform-ceo-intelligence.types";
import {
  PLATFORM_CEO_MAX_REPORTS,
  PLATFORM_CEO_MAX_AUDIT_ENTRIES,
  PLATFORM_CEO_MAX_MEMORY_ENTRIES,
  PLATFORM_CEO_STORE_SETTING_KEY,
} from "@/modules/control-center/platform-ceo/constants/platform-ceo";

interface PlatformCeoStorePayload {
  memory: PlatformCeoMemory;
  conversations: PlatformCeoConversation[];
  auditLogs: PlatformCeoAuditEntry[];
  reports: PlatformCeoExecutiveReport[];
}

function emptyMemory(): PlatformCeoMemory {
  return {
    operatorPreferences: {},
    pinnedBusinesses: [],
    pinnedReports: [],
    previousSummaries: [],
    previousRecommendations: [],
  };
}

function emptyStore(): PlatformCeoStorePayload {
  return {
    memory: emptyMemory(),
    conversations: [],
    auditLogs: [],
    reports: [],
  };
}

async function ensureCeoStoreDefinition(): Promise<void> {
  await prisma.configSettingDefinition.upsert({
    where: { key: PLATFORM_CEO_STORE_SETTING_KEY },
    create: {
      key: PLATFORM_CEO_STORE_SETTING_KEY,
      module: "platform",
      category: "governance",
      valueType: "JSON",
      defaultValue: emptyStore() as unknown as Prisma.InputJsonValue,
      helpText: "Platform CEO memory, conversations, and audit logs (operator scoped)",
      supportedScopes: ["PLATFORM"],
    },
    update: {},
  });
}

function scopeIdentifierForOperator(operatorUserId: string): string {
  return `ceo:${operatorUserId}`;
}

async function loadStore(operatorUserId: string): Promise<PlatformCeoStorePayload> {
  await ensureCeoStoreDefinition();

  const setting = await prisma.configSettingValue.findUnique({
    where: {
      definitionKey_scope_environment_scopeIdentifier: {
        definitionKey: PLATFORM_CEO_STORE_SETTING_KEY,
        scope: "PLATFORM",
        environment: "PRODUCTION",
        scopeIdentifier: scopeIdentifierForOperator(operatorUserId),
      },
    },
    select: { value: true },
  });

  if (!setting?.value) {
    return emptyStore();
  }

  const payload = setting.value as unknown as PlatformCeoStorePayload;
  return {
    memory: payload.memory ?? emptyMemory(),
    conversations: Array.isArray(payload.conversations) ? payload.conversations : [],
    auditLogs: Array.isArray(payload.auditLogs) ? payload.auditLogs : [],
    reports: Array.isArray(payload.reports) ? payload.reports : [],
  };
}

async function saveStore(
  operatorUserId: string,
  payload: PlatformCeoStorePayload,
): Promise<void> {
  await ensureCeoStoreDefinition();

  await prisma.configSettingValue.upsert({
    where: {
      definitionKey_scope_environment_scopeIdentifier: {
        definitionKey: PLATFORM_CEO_STORE_SETTING_KEY,
        scope: "PLATFORM",
        environment: "PRODUCTION",
        scopeIdentifier: scopeIdentifierForOperator(operatorUserId),
      },
    },
    create: {
      definitionKey: PLATFORM_CEO_STORE_SETTING_KEY,
      scope: "PLATFORM",
      environment: "PRODUCTION",
      scopeIdentifier: scopeIdentifierForOperator(operatorUserId),
      value: payload as unknown as Prisma.InputJsonValue,
    },
    update: {
      value: payload as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function loadPlatformCeoMemory(operatorUserId: string): Promise<PlatformCeoMemory> {
  const store = await loadStore(operatorUserId);
  return store.memory;
}

export async function savePlatformCeoMemory(
  operatorUserId: string,
  memory: PlatformCeoMemory,
): Promise<void> {
  const store = await loadStore(operatorUserId);
  store.memory = memory;
  await saveStore(operatorUserId, store);
}

export async function listPlatformCeoConversations(
  operatorUserId: string,
  query: PlatformCeoConversationQuery = {},
): Promise<PlatformCeoConversation[]> {
  const store = await loadStore(operatorUserId);
  const search = query.search?.trim().toLowerCase();
  const status = query.status ?? "all";
  const limit = query.limit ?? 50;

  let conversations = [...store.conversations].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );

  if (status !== "all") {
    conversations = conversations.filter((conversation) => conversation.status === status);
  }

  if (search) {
    conversations = conversations.filter(
      (conversation) =>
        conversation.title.toLowerCase().includes(search) ||
        conversation.messages.some((message) => message.content.toLowerCase().includes(search)),
    );
  }

  return conversations.slice(0, limit);
}

export async function getPlatformCeoConversation(
  operatorUserId: string,
  conversationId: string,
): Promise<PlatformCeoConversation | null> {
  const store = await loadStore(operatorUserId);
  return store.conversations.find((conversation) => conversation.id === conversationId) ?? null;
}

export async function createPlatformCeoConversation(
  operatorUserId: string,
  title: string,
): Promise<PlatformCeoConversation> {
  const store = await loadStore(operatorUserId);
  const now = new Date().toISOString();
  const conversation: PlatformCeoConversation = {
    id: randomUUID(),
    title: title.trim() || "New conversation",
    status: "active",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  store.conversations.unshift(conversation);
  await saveStore(operatorUserId, store);
  return conversation;
}

export async function appendPlatformCeoMessages(
  operatorUserId: string,
  conversationId: string,
  messages: PlatformCeoMessage[],
): Promise<PlatformCeoConversation> {
  const store = await loadStore(operatorUserId);
  const index = store.conversations.findIndex((conversation) => conversation.id === conversationId);

  if (index === -1) {
    throw new Error("Conversation not found");
  }

  const conversation = store.conversations[index];
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  conversation.messages.push(...messages);
  conversation.updatedAt = new Date().toISOString();
  store.conversations[index] = conversation;
  await saveStore(operatorUserId, store);
  return conversation;
}

export async function renamePlatformCeoConversation(
  operatorUserId: string,
  conversationId: string,
  title: string,
): Promise<PlatformCeoConversation> {
  const store = await loadStore(operatorUserId);
  const conversation = store.conversations.find((entry) => entry.id === conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  conversation.title = title.trim() || conversation.title;
  conversation.updatedAt = new Date().toISOString();
  await saveStore(operatorUserId, store);
  return conversation;
}

export async function archivePlatformCeoConversation(
  operatorUserId: string,
  conversationId: string,
): Promise<PlatformCeoConversation> {
  const store = await loadStore(operatorUserId);
  const conversation = store.conversations.find((entry) => entry.id === conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  conversation.status = "archived";
  conversation.updatedAt = new Date().toISOString();
  await saveStore(operatorUserId, store);
  return conversation;
}

export async function deletePlatformCeoConversation(
  operatorUserId: string,
  conversationId: string,
): Promise<void> {
  const store = await loadStore(operatorUserId);
  store.conversations = store.conversations.filter(
    (conversation) => conversation.id !== conversationId,
  );
  await saveStore(operatorUserId, store);
}

export async function appendPlatformCeoAuditEntry(
  operatorUserId: string,
  entry: PlatformCeoAuditEntry,
): Promise<void> {
  const store = await loadStore(operatorUserId);
  store.auditLogs.unshift(entry);
  store.auditLogs = store.auditLogs.slice(0, PLATFORM_CEO_MAX_AUDIT_ENTRIES);
  await saveStore(operatorUserId, store);
}

export async function appendPlatformCeoMemorySummary(
  operatorUserId: string,
  summary: string,
): Promise<void> {
  const store = await loadStore(operatorUserId);
  store.memory.previousSummaries.unshift({
    id: randomUUID(),
    content: summary,
    createdAt: new Date().toISOString(),
  });
  store.memory.previousSummaries = store.memory.previousSummaries.slice(
    0,
    PLATFORM_CEO_MAX_MEMORY_ENTRIES,
  );
  await saveStore(operatorUserId, store);
}

export async function appendPlatformCeoMemoryRecommendation(
  operatorUserId: string,
  recommendation: string,
): Promise<void> {
  const store = await loadStore(operatorUserId);
  store.memory.previousRecommendations.unshift({
    id: randomUUID(),
    content: recommendation,
    createdAt: new Date().toISOString(),
  });
  store.memory.previousRecommendations = store.memory.previousRecommendations.slice(
    0,
    PLATFORM_CEO_MAX_MEMORY_ENTRIES,
  );
  await saveStore(operatorUserId, store);
}

export async function listPlatformCeoAuditEntries(
  operatorUserId: string,
  limit = 100,
): Promise<PlatformCeoAuditEntry[]> {
  const store = await loadStore(operatorUserId);
  return store.auditLogs.slice(0, limit);
}

export async function listPlatformCeoReports(
  operatorUserId: string,
  kind?: ExecutiveReportKind,
  limit = 50,
): Promise<PlatformCeoExecutiveReport[]> {
  const store = await loadStore(operatorUserId);
  let reports = [...store.reports].sort(
    (left, right) => new Date(right.generatedAt).getTime() - new Date(left.generatedAt).getTime(),
  );

  if (kind) {
    reports = reports.filter((report) => report.kind === kind);
  }

  return reports.slice(0, limit);
}

export async function savePlatformCeoReport(
  operatorUserId: string,
  report: PlatformCeoExecutiveReport,
): Promise<PlatformCeoExecutiveReport> {
  const store = await loadStore(operatorUserId);
  store.reports.unshift(report);
  store.reports = store.reports.slice(0, PLATFORM_CEO_MAX_REPORTS);
  await saveStore(operatorUserId, store);
  return report;
}

export async function getPlatformCeoReport(
  operatorUserId: string,
  reportId: string,
): Promise<PlatformCeoExecutiveReport | null> {
  const store = await loadStore(operatorUserId);
  return store.reports.find((report) => report.id === reportId) ?? null;
}
