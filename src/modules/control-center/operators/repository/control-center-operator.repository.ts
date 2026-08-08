import "server-only";

import { randomUUID } from "crypto";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getControlCenterOperatorEmails } from "@/modules/control-center/lib/resolve-control-center-authorization";
import {
  CONTROL_CENTER_OPERATOR_PAGE_SIZE,
  OPERATOR_REGISTRY_SETTING_KEY,
  OPERATOR_ROLE_PERMISSIONS,
} from "@/modules/control-center/operators/constants/control-center-operators";
import type {
  ControlCenterOperatorDirectoryQuery,
  OperatorStatus,
  PlatformOperatorRole,
} from "@/modules/control-center/operators/types/control-center-operators-types";

export interface StoredPlatformOperatorRecord {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: PlatformOperatorRole;
  status: OperatorStatus;
  department: string | null;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
  deletedAt: string | null;
}

interface OperatorRegistryPayload {
  operators: StoredPlatformOperatorRecord[];
}

const PLATFORM_SCOPE_IDENTIFIER = "platform";

async function ensureOperatorRegistryDefinition(): Promise<void> {
  await prisma.configSettingDefinition.upsert({
    where: { key: OPERATOR_REGISTRY_SETTING_KEY },
    create: {
      key: OPERATOR_REGISTRY_SETTING_KEY,
      module: "platform",
      category: "governance",
      valueType: "JSON",
      defaultValue: { operators: [] },
      helpText: "Control Center operator registry",
      supportedScopes: ["PLATFORM"],
    },
    update: {},
  });
}

export async function loadOperatorRegistry(): Promise<StoredPlatformOperatorRecord[]> {
  await ensureOperatorRegistryDefinition();

  const setting = await prisma.configSettingValue.findUnique({
    where: {
      definitionKey_scope_environment_scopeIdentifier: {
        definitionKey: OPERATOR_REGISTRY_SETTING_KEY,
        scope: "PLATFORM",
        environment: "PRODUCTION",
        scopeIdentifier: PLATFORM_SCOPE_IDENTIFIER,
      },
    },
    select: { value: true },
  });

  const payload = (setting?.value ?? { operators: [] }) as unknown as OperatorRegistryPayload;
  let operators = Array.isArray(payload.operators) ? payload.operators : [];

  if (operators.filter((entry) => !entry.deletedAt).length === 0) {
    operators = await bootstrapOperatorsFromEnv(operators);
  }

  return operators.filter((entry) => !entry.deletedAt);
}

async function bootstrapOperatorsFromEnv(
  existing: StoredPlatformOperatorRecord[],
): Promise<StoredPlatformOperatorRecord[]> {
  const envEmails = getControlCenterOperatorEmails();
  if (envEmails.length === 0) {
    return existing;
  }

  const users = await prisma.user.findMany({
    where: { email: { in: envEmails } },
    select: { id: true, email: true, fullName: true },
  });

  const now = new Date().toISOString();
  const bootstrapped: StoredPlatformOperatorRecord[] = [...existing];

  for (const [index, email] of envEmails.entries()) {
    const user = users.find((entry) => entry.email.toLowerCase() === email);
    if (!user) continue;

    if (bootstrapped.some((entry) => entry.userId === user.id && !entry.deletedAt)) {
      continue;
    }

    bootstrapped.push({
      id: randomUUID(),
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: index === 0 ? "PLATFORM_OWNER" : "SUPER_ADMIN",
      status: "active",
      department: "Governance",
      permissions: OPERATOR_ROLE_PERMISSIONS[index === 0 ? "PLATFORM_OWNER" : "SUPER_ADMIN"],
      createdAt: now,
      updatedAt: now,
      createdById: null,
      deletedAt: null,
    });
  }

  await saveOperatorRegistry(bootstrapped);
  return bootstrapped.filter((entry) => !entry.deletedAt);
}

export async function saveOperatorRegistry(
  operators: StoredPlatformOperatorRecord[],
): Promise<void> {
  await ensureOperatorRegistryDefinition();

  const payload: OperatorRegistryPayload = { operators };

  await prisma.configSettingValue.upsert({
    where: {
      definitionKey_scope_environment_scopeIdentifier: {
        definitionKey: OPERATOR_REGISTRY_SETTING_KEY,
        scope: "PLATFORM",
        environment: "PRODUCTION",
        scopeIdentifier: PLATFORM_SCOPE_IDENTIFIER,
      },
    },
    create: {
      definitionKey: OPERATOR_REGISTRY_SETTING_KEY,
      scope: "PLATFORM",
      environment: "PRODUCTION",
      scopeIdentifier: PLATFORM_SCOPE_IDENTIFIER,
      value: payload as unknown as Prisma.InputJsonValue,
    },
    update: {
      value: payload as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function findOperatorRecordById(
  operatorId: string,
): Promise<StoredPlatformOperatorRecord | null> {
  const registry = await loadOperatorRegistry();
  return registry.find((entry) => entry.id === operatorId) ?? null;
}

export async function findOperatorRecordByUserId(
  userId: string,
): Promise<StoredPlatformOperatorRecord | null> {
  const registry = await loadOperatorRegistry();
  return registry.find((entry) => entry.userId === userId) ?? null;
}

export async function loadOperatorUserMetrics(userIds: string[]) {
  if (userIds.length === 0) {
    return {
      sessionsByUser: new Map<string, number>(),
      lastLoginByUser: new Map<string, Date>(),
      mfaByUser: new Map<string, { enabled: boolean; types: string[] }>(),
    };
  }

  const [sessions, mfaRows] = await Promise.all([
    prisma.iamSession.findMany({
      where: { userId: { in: userIds }, isActive: true, revokedAt: null },
      select: { userId: true, loginAt: true, lastActivityAt: true },
    }),
    prisma.iamMfaEnrollment.findMany({
      where: { userId: { in: userIds }, isVerified: true },
      select: { userId: true, mfaType: true },
    }),
  ]);

  const sessionsByUser = new Map<string, number>();
  const lastLoginByUser = new Map<string, Date>();
  const mfaByUser = new Map<string, { enabled: boolean; types: string[] }>();

  for (const session of sessions) {
    if (!session.userId) continue;
    sessionsByUser.set(session.userId, (sessionsByUser.get(session.userId) ?? 0) + 1);
    const last = lastLoginByUser.get(session.userId);
    const candidate = session.lastActivityAt ?? session.loginAt;
    if (!last || candidate > last) {
      lastLoginByUser.set(session.userId, candidate);
    }
  }

  for (const row of mfaRows) {
    if (!row.userId) continue;
    const current = mfaByUser.get(row.userId) ?? { enabled: false, types: [] };
    current.enabled = true;
    current.types.push(row.mfaType);
    mfaByUser.set(row.userId, current);
  }

  return { sessionsByUser, lastLoginByUser, mfaByUser };
}

export function filterAndSortOperators(
  records: StoredPlatformOperatorRecord[],
  query: ControlCenterOperatorDirectoryQuery,
  metrics: Awaited<ReturnType<typeof loadOperatorUserMetrics>>,
): StoredPlatformOperatorRecord[] {
  let items = [...records];

  if (query.search?.trim()) {
    const term = query.search.trim().toLowerCase();
    items = items.filter(
      (entry) =>
        entry.fullName.toLowerCase().includes(term) ||
        entry.email.toLowerCase().includes(term) ||
        (entry.department?.toLowerCase().includes(term) ?? false),
    );
  }

  if (query.role) {
    items = items.filter((entry) => entry.role === query.role);
  }

  if (query.status) {
    items = items.filter((entry) => entry.status === query.status);
  }

  if (query.department?.trim()) {
    const department = query.department.trim().toLowerCase();
    items = items.filter((entry) => entry.department?.toLowerCase() === department);
  }

  if (query.mfaEnabled !== null && query.mfaEnabled !== undefined) {
    items = items.filter((entry) => {
      const mfa = metrics.mfaByUser.get(entry.userId)?.enabled ?? false;
      return mfa === query.mfaEnabled;
    });
  }

  const direction = query.sortDirection === "asc" ? 1 : -1;

  items.sort((a, b) => {
    switch (query.sortBy) {
      case "fullName":
        return a.fullName.localeCompare(b.fullName) * direction;
      case "email":
        return a.email.localeCompare(b.email) * direction;
      case "role":
        return a.role.localeCompare(b.role) * direction;
      case "status":
        return a.status.localeCompare(b.status) * direction;
      case "lastLogin": {
        const aLogin = metrics.lastLoginByUser.get(a.userId)?.getTime() ?? 0;
        const bLogin = metrics.lastLoginByUser.get(b.userId)?.getTime() ?? 0;
        return (aLogin - bLogin) * direction;
      }
      case "createdAt":
      default:
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
    }
  });

  return items;
}

export function paginateOperators<T>(
  items: T[],
  query: ControlCenterOperatorDirectoryQuery,
): { items: T[]; total: number; page: number; pageSize: number; totalPages: number } {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_OPERATOR_PAGE_SIZE;
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function loadAllOperatorRecordsIncludingDeleted(): Promise<StoredPlatformOperatorRecord[]> {
  await ensureOperatorRegistryDefinition();

  const setting = await prisma.configSettingValue.findUnique({
    where: {
      definitionKey_scope_environment_scopeIdentifier: {
        definitionKey: OPERATOR_REGISTRY_SETTING_KEY,
        scope: "PLATFORM",
        environment: "PRODUCTION",
        scopeIdentifier: PLATFORM_SCOPE_IDENTIFIER,
      },
    },
    select: { value: true },
  });

  const payload = (setting?.value ?? { operators: [] }) as unknown as OperatorRegistryPayload;
  return Array.isArray(payload.operators) ? payload.operators : [];
}
