import "server-only";

import type {
  PlatformIncidentSeverity,
  PlatformObservabilityAlertStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getObservabilityBusinessId } from "@/services/observability-platform-context.service";

export async function createAlert(
  ownerId: string,
  input: {
    name: string;
    condition?: string;
    severity?: PlatformIncidentSeverity;
    metadata?: Record<string, unknown>;
  },
) {
  const businessId = await getObservabilityBusinessId(ownerId);
  return prisma.platformAlert.create({
    data: {
      businessId,
      name: input.name.trim(),
      condition: input.condition ?? "",
      severity: input.severity ?? "MEDIUM",
      status: "ACTIVE",
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function listAlerts(
  ownerId: string,
  filters?: { status?: PlatformObservabilityAlertStatus; severity?: PlatformIncidentSeverity },
) {
  const businessId = await getObservabilityBusinessId(ownerId);
  return prisma.platformAlert.findMany({
    where: {
      businessId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.severity ? { severity: filters.severity } : {}),
    },
    orderBy: { triggeredAt: "desc" },
  });
}

export async function acknowledgeAlert(ownerId: string, alertId: string) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const alert = await prisma.platformAlert.findFirst({
    where: { id: alertId, businessId, status: "ACTIVE" },
  });
  if (!alert) return null;

  return prisma.platformAlert.update({
    where: { id: alertId },
    data: { status: "ACKNOWLEDGED" },
  });
}

export async function resolveAlert(ownerId: string, alertId: string) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const alert = await prisma.platformAlert.findFirst({
    where: { id: alertId, businessId },
  });
  if (!alert) return null;

  return prisma.platformAlert.update({
    where: { id: alertId },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
}

export function validateAlertCondition(condition: string): { valid: boolean; reason?: string } {
  const trimmed = condition.trim();
  if (!trimmed) return { valid: true };
  if (trimmed.length > 500) return { valid: false, reason: "Condition exceeds maximum length" };
  if (!/^[a-zA-Z0-9_\s.><=!%+-]+$/.test(trimmed)) {
    return { valid: false, reason: "Condition contains invalid characters" };
  }
  return { valid: true };
}

export async function getAlertsSummary(ownerId: string) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const [active, acknowledged, resolved] = await Promise.all([
    prisma.platformAlert.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.platformAlert.count({ where: { businessId, status: "ACKNOWLEDGED" } }),
    prisma.platformAlert.count({ where: { businessId, status: "RESOLVED" } }),
  ]);
  return { active, acknowledged, resolved };
}

export async function ensureDefaultAlerts(ownerId: string) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const existing = await prisma.platformAlert.count({ where: { businessId } });
  if (existing > 0) return;

  await createAlert(ownerId, {
    name: "High error rate",
    condition: "error_rate > 5%",
    severity: "HIGH",
  });
  await createAlert(ownerId, {
    name: "Payment latency spike",
    condition: "payment.latency_p95 > 500ms",
    severity: "MEDIUM",
  });
}
