import "server-only";

import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import {
  PLATFORM_AUTOMATION_AUDIT_KEY,
  PLATFORM_AUTOMATION_AUDIT_PAGE_SIZE,
  PLATFORM_AUTOMATION_EXECUTIONS_KEY,
  PLATFORM_AUTOMATION_EXECUTION_PAGE_SIZE,
  PLATFORM_AUTOMATION_MAX_AUDIT_ENTRIES,
  PLATFORM_AUTOMATION_MAX_EXECUTIONS,
  PLATFORM_AUTOMATION_PAGE_SIZE,
  PLATFORM_AUTOMATION_WORKFLOWS_KEY,
} from "@/modules/control-center/automation/constants/control-center-platform-automation";
import type {
  CreatePlatformAutomationInput,
  PlatformAutomationAuditDirectoryResult,
  PlatformAutomationAuditEntry,
  PlatformAutomationAuditQuery,
  PlatformAutomationDetail,
  PlatformAutomationDirectoryResult,
  PlatformAutomationExecutionDetail,
  PlatformAutomationExecutionDirectoryResult,
  PlatformAutomationExecutionQuery,
  PlatformAutomationExecutionSummary,
  PlatformAutomationFilterOptions,
  PlatformAutomationManagementQuery,
  PlatformAutomationOverview,
  PlatformAutomationSummary,
  UpdatePlatformAutomationInput,
} from "@/modules/control-center/automation/types/control-center-platform-automation-types";

const PLATFORM_SCOPE_IDENTIFIER = "platform";

export interface StoredPlatformAutomationRecord {
  id: string;
  name: string;
  description: string;
  category: PlatformAutomationSummary["category"];
  status: PlatformAutomationSummary["status"];
  priority: PlatformAutomationSummary["priority"];
  trigger: PlatformAutomationDetail["trigger"];
  conditions: PlatformAutomationDetail["conditions"];
  actions: PlatformAutomationDetail["actions"];
  enabled: boolean;
  ownerId: string | null;
  ownerEmail: string | null;
  businessId: string | null;
  businessName: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  deletedAt: string | null;
}

export interface StoredPlatformAutomationExecutionRecord {
  id: string;
  automationId: string;
  automationName: string;
  status: PlatformAutomationExecutionSummary["status"];
  triggerType: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error: string | null;
  logs: PlatformAutomationExecutionDetail["logs"];
  triggeredById: string | null;
  triggeredByEmail: string | null;
  businessId: string | null;
  businessName: string | null;
}

export interface StoredPlatformAutomationAuditRecord {
  id: string;
  automationId: string | null;
  automationName: string | null;
  executionId: string | null;
  eventType: string;
  actorId: string;
  actorEmail: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface WorkflowRegistryPayload {
  automations: StoredPlatformAutomationRecord[];
}

interface ExecutionRegistryPayload {
  executions: StoredPlatformAutomationExecutionRecord[];
}

interface AuditRegistryPayload {
  entries: StoredPlatformAutomationAuditRecord[];
}

async function ensurePlatformSettingDefinition(key: string, helpText: string): Promise<void> {
  await prisma.configSettingDefinition.upsert({
    where: { key },
    create: {
      key,
      module: "platform",
      category: "automation",
      valueType: "JSON",
      defaultValue: key.includes("workflows")
        ? { automations: [] }
        : key.includes("executions")
          ? { executions: [] }
          : { entries: [] },
      helpText,
      supportedScopes: ["PLATFORM"],
    },
    update: {},
  });
}

async function readPlatformSetting<T>(key: string, fallback: T): Promise<T> {
  await ensurePlatformSettingDefinition(key, `Platform automation ${key}`);

  const setting = await prisma.configSettingValue.findUnique({
    where: {
      definitionKey_scope_environment_scopeIdentifier: {
        definitionKey: key,
        scope: "PLATFORM",
        environment: "PRODUCTION",
        scopeIdentifier: PLATFORM_SCOPE_IDENTIFIER,
      },
    },
    select: { value: true },
  });

  return (setting?.value ?? fallback) as T;
}

async function writePlatformSetting(key: string, value: unknown): Promise<void> {
  await ensurePlatformSettingDefinition(key, `Platform automation ${key}`);

  await prisma.configSettingValue.upsert({
    where: {
      definitionKey_scope_environment_scopeIdentifier: {
        definitionKey: key,
        scope: "PLATFORM",
        environment: "PRODUCTION",
        scopeIdentifier: PLATFORM_SCOPE_IDENTIFIER,
      },
    },
    create: {
      definitionKey: key,
      scope: "PLATFORM",
      environment: "PRODUCTION",
      scopeIdentifier: PLATFORM_SCOPE_IDENTIFIER,
      value: value as object,
    },
    update: {
      value: value as object,
    },
  });
}

export async function loadPlatformAutomationRegistry(): Promise<StoredPlatformAutomationRecord[]> {
  const payload = await readPlatformSetting<WorkflowRegistryPayload>(
    PLATFORM_AUTOMATION_WORKFLOWS_KEY,
    { automations: [] },
  );
  return Array.isArray(payload.automations)
    ? payload.automations.filter((entry) => !entry.deletedAt)
    : [];
}

async function savePlatformAutomationRegistry(
  automations: StoredPlatformAutomationRecord[],
): Promise<void> {
  await writePlatformSetting(PLATFORM_AUTOMATION_WORKFLOWS_KEY, { automations });
}

export async function loadPlatformAutomationExecutions(): Promise<
  StoredPlatformAutomationExecutionRecord[]
> {
  const payload = await readPlatformSetting<ExecutionRegistryPayload>(
    PLATFORM_AUTOMATION_EXECUTIONS_KEY,
    { executions: [] },
  );
  return Array.isArray(payload.executions) ? payload.executions : [];
}

async function savePlatformAutomationExecutions(
  executions: StoredPlatformAutomationExecutionRecord[],
): Promise<void> {
  const trimmed = executions
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, PLATFORM_AUTOMATION_MAX_EXECUTIONS);
  await writePlatformSetting(PLATFORM_AUTOMATION_EXECUTIONS_KEY, { executions: trimmed });
}

export async function loadPlatformAutomationAuditEntries(): Promise<
  StoredPlatformAutomationAuditRecord[]
> {
  const payload = await readPlatformSetting<AuditRegistryPayload>(PLATFORM_AUTOMATION_AUDIT_KEY, {
    entries: [],
  });
  return Array.isArray(payload.entries) ? payload.entries : [];
}

async function savePlatformAutomationAuditEntries(
  entries: StoredPlatformAutomationAuditRecord[],
): Promise<void> {
  const trimmed = entries
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, PLATFORM_AUTOMATION_MAX_AUDIT_ENTRIES);
  await writePlatformSetting(PLATFORM_AUTOMATION_AUDIT_KEY, { entries: trimmed });
}

function computeSuccessRate(
  automationId: string,
  executions: StoredPlatformAutomationExecutionRecord[],
): number | null {
  const relevant = executions.filter((entry) => entry.automationId === automationId);
  if (relevant.length === 0) return null;
  const completed = relevant.filter((entry) => entry.status === "completed").length;
  return Math.round((completed / relevant.length) * 100);
}

function serializeSummary(
  record: StoredPlatformAutomationRecord,
  executions: StoredPlatformAutomationExecutionRecord[],
): PlatformAutomationSummary {
  const automationExecutions = executions.filter((entry) => entry.automationId === record.id);
  const lastExecution = automationExecutions.sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt),
  )[0];

  return {
    id: record.id,
    name: record.name,
    description: record.description,
    category: record.category,
    status: record.status,
    priority: record.priority,
    triggerType: record.trigger.type,
    enabled: record.enabled,
    ownerId: record.ownerId,
    ownerEmail: record.ownerEmail,
    businessId: record.businessId,
    businessName: record.businessName,
    actionCount: record.actions.length,
    conditionCount: record.conditions.length,
    lastExecutedAt: lastExecution?.startedAt ?? null,
    executionCount: automationExecutions.length,
    successRate: computeSuccessRate(record.id, executions),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function serializeDetail(
  record: StoredPlatformAutomationRecord,
  executions: StoredPlatformAutomationExecutionRecord[],
): PlatformAutomationDetail {
  return {
    ...serializeSummary(record, executions),
    trigger: record.trigger,
    conditions: record.conditions,
    actions: record.actions,
    createdById: record.createdById,
  };
}

function serializeExecutionSummary(
  record: StoredPlatformAutomationExecutionRecord,
): PlatformAutomationExecutionSummary {
  return {
    id: record.id,
    automationId: record.automationId,
    automationName: record.automationName,
    status: record.status,
    triggerType: record.triggerType,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    durationMs: record.durationMs,
    error: record.error,
    triggeredById: record.triggeredById,
    triggeredByEmail: record.triggeredByEmail,
    businessId: record.businessId,
    businessName: record.businessName,
  };
}

function serializeExecutionDetail(
  record: StoredPlatformAutomationExecutionRecord,
): PlatformAutomationExecutionDetail {
  return {
    ...serializeExecutionSummary(record),
    input: record.input,
    output: record.output,
    logs: record.logs,
  };
}

function serializeAuditEntry(record: StoredPlatformAutomationAuditRecord): PlatformAutomationAuditEntry {
  return {
    id: record.id,
    automationId: record.automationId,
    automationName: record.automationName,
    executionId: record.executionId,
    eventType: record.eventType,
    actorId: record.actorId,
    actorEmail: record.actorEmail,
    message: record.message,
    metadata: record.metadata,
    createdAt: record.createdAt,
  };
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function logPlatformAutomationAudit(input: {
  automationId?: string | null;
  automationName?: string | null;
  executionId?: string | null;
  eventType: string;
  actorId: string;
  actorEmail: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const entries = await loadPlatformAutomationAuditEntries();
  entries.unshift({
    id: randomUUID(),
    automationId: input.automationId ?? null,
    automationName: input.automationName ?? null,
    executionId: input.executionId ?? null,
    eventType: input.eventType,
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    message: input.message,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
  });
  await savePlatformAutomationAuditEntries(entries);
}

async function resolveBusinessName(businessId: string | null | undefined): Promise<string | null> {
  if (!businessId) return null;
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { businessName: true },
  });
  return business?.businessName?.trim() || null;
}

export async function loadPlatformAutomationOverview(): Promise<PlatformAutomationOverview> {
  const [automations, executions] = await Promise.all([
    loadPlatformAutomationRegistry(),
    loadPlatformAutomationExecutions(),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const executionsToday = executions.filter((entry) => entry.startedAt >= todayIso);
  const failedToday = executionsToday.filter((entry) => entry.status === "failed").length;
  const completedToday = executionsToday.filter((entry) => entry.status === "completed");
  const successRate =
    executionsToday.length > 0
      ? Math.round((completedToday.length / executionsToday.length) * 100)
      : 100;

  const durations = executionsToday
    .map((entry) => entry.durationMs)
    .filter((value): value is number => typeof value === "number" && value >= 0);
  const averageExecutionMs =
    durations.length > 0
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : 0;

  return {
    totalAutomations: automations.length,
    running: automations.filter((entry) => entry.status === "active" && entry.enabled).length,
    paused: automations.filter((entry) => entry.status === "paused" || !entry.enabled).length,
    failedExecutionsToday: failedToday,
    executionsToday: executionsToday.length,
    successRate,
    averageExecutionMs,
    activeCategories: new Set(automations.map((entry) => entry.category)).size,
  };
}

export async function queryPlatformAutomations(
  query: PlatformAutomationManagementQuery = {},
): Promise<PlatformAutomationDirectoryResult> {
  const [automations, executions] = await Promise.all([
    loadPlatformAutomationRegistry(),
    loadPlatformAutomationExecutions(),
  ]);

  const search = query.search?.trim().toLowerCase();
  let filtered = automations;

  if (search) {
    filtered = filtered.filter(
      (entry) =>
        entry.name.toLowerCase().includes(search) ||
        entry.description.toLowerCase().includes(search) ||
        entry.ownerEmail?.toLowerCase().includes(search) ||
        entry.businessName?.toLowerCase().includes(search),
    );
  }

  if (query.category) {
    filtered = filtered.filter((entry) => entry.category === query.category);
  }
  if (query.status) {
    filtered = filtered.filter((entry) => entry.status === query.status);
  }
  if (query.trigger) {
    filtered = filtered.filter((entry) => entry.trigger.type === query.trigger);
  }
  if (query.priority) {
    filtered = filtered.filter((entry) => entry.priority === query.priority);
  }
  if (query.ownerId) {
    filtered = filtered.filter((entry) => entry.ownerId === query.ownerId);
  }
  if (query.businessId) {
    filtered = filtered.filter((entry) => entry.businessId === query.businessId);
  }

  filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const page = query.page ?? 1;
  const paged = paginate(filtered, page, PLATFORM_AUTOMATION_PAGE_SIZE);

  return {
    ...paged,
    items: paged.items.map((entry) => serializeSummary(entry, executions)),
  };
}

export async function queryPlatformAutomationExecutions(
  query: PlatformAutomationExecutionQuery = {},
): Promise<PlatformAutomationExecutionDirectoryResult> {
  let executions = await loadPlatformAutomationExecutions();
  const search = query.search?.trim().toLowerCase();

  if (search) {
    executions = executions.filter(
      (entry) =>
        entry.automationName.toLowerCase().includes(search) ||
        entry.triggeredByEmail?.toLowerCase().includes(search) ||
        entry.businessName?.toLowerCase().includes(search) ||
        entry.error?.toLowerCase().includes(search),
    );
  }
  if (query.automationId) {
    executions = executions.filter((entry) => entry.automationId === query.automationId);
  }
  if (query.status) {
    executions = executions.filter((entry) => entry.status === query.status);
  }
  if (query.businessId) {
    executions = executions.filter((entry) => entry.businessId === query.businessId);
  }

  executions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const page = query.page ?? 1;
  const paged = paginate(executions, page, PLATFORM_AUTOMATION_EXECUTION_PAGE_SIZE);

  return {
    ...paged,
    items: paged.items.map(serializeExecutionSummary),
  };
}

export async function queryPlatformAutomationAuditTrail(
  query: PlatformAutomationAuditQuery = {},
): Promise<PlatformAutomationAuditDirectoryResult> {
  let entries = await loadPlatformAutomationAuditEntries();

  if (query.automationId) {
    entries = entries.filter((entry) => entry.automationId === query.automationId);
  }
  if (query.executionId) {
    entries = entries.filter((entry) => entry.executionId === query.executionId);
  }
  if (query.eventType) {
    entries = entries.filter((entry) => entry.eventType === query.eventType);
  }

  entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const page = query.page ?? 1;
  const paged = paginate(entries, page, PLATFORM_AUTOMATION_AUDIT_PAGE_SIZE);

  return {
    ...paged,
    items: paged.items.map(serializeAuditEntry),
  };
}

export async function loadPlatformAutomationFilterOptions(): Promise<PlatformAutomationFilterOptions> {
  const automations = await loadPlatformAutomationRegistry();
  const ownerMap = new Map<string, { id: string; email: string; name: string }>();
  const businessMap = new Map<string, { id: string; name: string }>();

  for (const entry of automations) {
    if (entry.ownerId && entry.ownerEmail) {
      ownerMap.set(entry.ownerId, {
        id: entry.ownerId,
        email: entry.ownerEmail,
        name: entry.ownerEmail,
      });
    }
    if (entry.businessId && entry.businessName) {
      businessMap.set(entry.businessId, { id: entry.businessId, name: entry.businessName });
    }
  }

  return {
    categories: [...new Set(automations.map((entry) => entry.category))],
    statuses: [...new Set(automations.map((entry) => entry.status))],
    triggers: [...new Set(automations.map((entry) => entry.trigger.type))],
    priorities: [...new Set(automations.map((entry) => entry.priority))],
    owners: [...ownerMap.values()],
    businesses: [...businessMap.values()],
  };
}

export async function getPlatformAutomationDetail(
  automationId: string,
): Promise<PlatformAutomationDetail | null> {
  const [automations, executions] = await Promise.all([
    loadPlatformAutomationRegistry(),
    loadPlatformAutomationExecutions(),
  ]);
  const record = automations.find((entry) => entry.id === automationId);
  return record ? serializeDetail(record, executions) : null;
}

export async function getPlatformAutomationExecutionDetail(
  executionId: string,
): Promise<PlatformAutomationExecutionDetail | null> {
  const executions = await loadPlatformAutomationExecutions();
  const record = executions.find((entry) => entry.id === executionId);
  return record ? serializeExecutionDetail(record) : null;
}

export async function createPlatformAutomationRecord(
  actorId: string,
  actorEmail: string,
  input: CreatePlatformAutomationInput,
): Promise<{ id: string }> {
  const automations = await loadPlatformAutomationRegistry();
  const now = new Date().toISOString();
  const businessName = await resolveBusinessName(input.businessId ?? null);
  const id = randomUUID();

  automations.push({
    id,
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    category: input.category,
    status: input.enabled ? "active" : "draft",
    priority: input.priority ?? "medium",
    trigger: input.trigger,
    conditions: input.conditions ?? [],
    actions: input.actions,
    enabled: input.enabled ?? false,
    ownerId: actorId,
    ownerEmail: actorEmail,
    businessId: input.businessId ?? null,
    businessName,
    createdAt: now,
    updatedAt: now,
    createdById: actorId,
    deletedAt: null,
  });

  await savePlatformAutomationRegistry(automations);
  await logPlatformAutomationAudit({
    automationId: id,
    automationName: input.name.trim(),
    eventType: "automation.created",
    actorId,
    actorEmail,
    message: `Created automation "${input.name.trim()}"`,
    metadata: { category: input.category, trigger: input.trigger.type },
  });

  return { id };
}

export async function updatePlatformAutomationRecord(
  actorId: string,
  actorEmail: string,
  automationId: string,
  input: UpdatePlatformAutomationInput,
): Promise<void> {
  const automations = await loadPlatformAutomationRegistry();
  const index = automations.findIndex((entry) => entry.id === automationId);
  if (index < 0) throw new Error("Automation not found");

  const current = automations[index]!;
  const businessName =
    input.businessId !== undefined
      ? await resolveBusinessName(input.businessId)
      : current.businessName;

  automations[index] = {
    ...current,
    name: input.name?.trim() ?? current.name,
    description: input.description?.trim() ?? current.description,
    category: input.category ?? current.category,
    priority: input.priority ?? current.priority,
    trigger: input.trigger ?? current.trigger,
    conditions: input.conditions ?? current.conditions,
    actions: input.actions ?? current.actions,
    businessId: input.businessId !== undefined ? input.businessId : current.businessId,
    businessName,
    enabled: input.enabled ?? current.enabled,
    status: input.status ?? current.status,
    updatedAt: new Date().toISOString(),
  };

  await savePlatformAutomationRegistry(automations);
  await logPlatformAutomationAudit({
    automationId,
    automationName: automations[index]!.name,
    eventType: "automation.updated",
    actorId,
    actorEmail,
    message: `Updated automation "${automations[index]!.name}"`,
  });
}

export async function clonePlatformAutomationRecord(
  actorId: string,
  actorEmail: string,
  automationId: string,
): Promise<{ id: string }> {
  const automations = await loadPlatformAutomationRegistry();
  const source = automations.find((entry) => entry.id === automationId);
  if (!source) throw new Error("Automation not found");

  const now = new Date().toISOString();
  const id = randomUUID();

  automations.push({
    ...source,
    id,
    name: `${source.name} (Copy)`,
    status: "draft",
    enabled: false,
    createdAt: now,
    updatedAt: now,
    createdById: actorId,
    ownerId: actorId,
    ownerEmail: actorEmail,
  });

  await savePlatformAutomationRegistry(automations);
  await logPlatformAutomationAudit({
    automationId: id,
    automationName: `${source.name} (Copy)`,
    eventType: "automation.cloned",
    actorId,
    actorEmail,
    message: `Cloned automation from "${source.name}"`,
    metadata: { sourceAutomationId: automationId },
  });

  return { id };
}

export async function setPlatformAutomationStatus(
  actorId: string,
  actorEmail: string,
  automationId: string,
  status: StoredPlatformAutomationRecord["status"],
  enabled?: boolean,
): Promise<void> {
  const automations = await loadPlatformAutomationRegistry();
  const index = automations.findIndex((entry) => entry.id === automationId);
  if (index < 0) throw new Error("Automation not found");

  automations[index] = {
    ...automations[index]!,
    status,
    enabled: enabled ?? automations[index]!.enabled,
    updatedAt: new Date().toISOString(),
  };

  await savePlatformAutomationRegistry(automations);

  const eventType =
    status === "paused" ? "automation.paused" : status === "active" ? "automation.resumed" : "automation.updated";

  await logPlatformAutomationAudit({
    automationId,
    automationName: automations[index]!.name,
    eventType,
    actorId,
    actorEmail,
    message: `Set automation "${automations[index]!.name}" to ${status}`,
  });
}

export async function deletePlatformAutomationRecord(
  actorId: string,
  actorEmail: string,
  automationId: string,
): Promise<void> {
  const automations = await loadPlatformAutomationRegistry();
  const index = automations.findIndex((entry) => entry.id === automationId);
  if (index < 0) throw new Error("Automation not found");

  const name = automations[index]!.name;
  automations[index] = {
    ...automations[index]!,
    deletedAt: new Date().toISOString(),
    status: "archived",
    enabled: false,
  };

  await savePlatformAutomationRegistry(automations);
  await logPlatformAutomationAudit({
    automationId,
    automationName: name,
    eventType: "automation.deleted",
    actorId,
    actorEmail,
    message: `Deleted automation "${name}"`,
  });
}

export async function emergencyStopPlatformAutomations(
  actorId: string,
  actorEmail: string,
): Promise<number> {
  const automations = await loadPlatformAutomationRegistry();
  let stopped = 0;
  const now = new Date().toISOString();

  for (const entry of automations) {
    if (entry.enabled && entry.status === "active") {
      entry.enabled = false;
      entry.status = "paused";
      entry.updatedAt = now;
      stopped += 1;
    }
  }

  await savePlatformAutomationRegistry(automations);
  await logPlatformAutomationAudit({
    eventType: "emergency_stop",
    actorId,
    actorEmail,
    message: `Emergency stop activated — paused ${stopped} automations`,
    metadata: { stoppedCount: stopped },
  });

  return stopped;
}

export async function appendPlatformAutomationExecution(
  record: StoredPlatformAutomationExecutionRecord,
): Promise<void> {
  const executions = await loadPlatformAutomationExecutions();
  executions.unshift(record);
  await savePlatformAutomationExecutions(executions);
}

export async function updatePlatformAutomationExecution(
  executionId: string,
  patch: Partial<StoredPlatformAutomationExecutionRecord>,
): Promise<void> {
  const executions = await loadPlatformAutomationExecutions();
  const index = executions.findIndex((entry) => entry.id === executionId);
  if (index < 0) throw new Error("Execution not found");
  executions[index] = { ...executions[index]!, ...patch };
  await savePlatformAutomationExecutions(executions);
}

export async function exportPlatformAutomationPayload(): Promise<{
  automations: PlatformAutomationDetail[];
  executions: PlatformAutomationExecutionDetail[];
  auditTrail: PlatformAutomationAuditEntry[];
}> {
  const [automations, executions, auditEntries] = await Promise.all([
    loadPlatformAutomationRegistry(),
    loadPlatformAutomationExecutions(),
    loadPlatformAutomationAuditEntries(),
  ]);

  return {
    automations: automations.map((entry) => serializeDetail(entry, executions)),
    executions: executions.map(serializeExecutionDetail),
    auditTrail: auditEntries.map(serializeAuditEntry),
  };
}

export async function getStoredPlatformAutomationRecord(
  automationId: string,
): Promise<StoredPlatformAutomationRecord | null> {
  const automations = await loadPlatformAutomationRegistry();
  return automations.find((entry) => entry.id === automationId) ?? null;
}
