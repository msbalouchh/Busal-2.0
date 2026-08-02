import "server-only";

import type { PlatformIncidentSeverity, PlatformIncidentStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getObservabilityBusinessId } from "@/services/observability-platform-context.service";

export async function createIncident(
  ownerId: string,
  input: {
    title: string;
    description?: string;
    severity?: PlatformIncidentSeverity;
    assignedTo?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const businessId = await getObservabilityBusinessId(ownerId);
  return prisma.platformIncident.create({
    data: {
      businessId,
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      severity: input.severity ?? "MEDIUM",
      status: "OPEN",
      assignedTo: input.assignedTo ?? "",
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function listIncidents(
  ownerId: string,
  filters?: { status?: PlatformIncidentStatus; severity?: PlatformIncidentSeverity },
) {
  const businessId = await getObservabilityBusinessId(ownerId);
  return prisma.platformIncident.findMany({
    where: {
      businessId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.severity ? { severity: filters.severity } : {}),
    },
    orderBy: { startedAt: "desc" },
  });
}

export async function updateIncidentStatus(
  ownerId: string,
  incidentId: string,
  status: PlatformIncidentStatus,
) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const incident = await prisma.platformIncident.findFirst({
    where: { id: incidentId, businessId },
  });
  if (!incident) return null;

  return prisma.platformIncident.update({
    where: { id: incidentId },
    data: {
      status,
      resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : null,
    },
  });
}

export async function assignIncident(ownerId: string, incidentId: string, assignedTo: string) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const incident = await prisma.platformIncident.findFirst({
    where: { id: incidentId, businessId },
  });
  if (!incident) return null;

  return prisma.platformIncident.update({
    where: { id: incidentId },
    data: { assignedTo: assignedTo.trim(), status: "INVESTIGATING" },
  });
}

export async function getIncidentsSummary(ownerId: string) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const [open, investigating, resolved] = await Promise.all([
    prisma.platformIncident.count({ where: { businessId, status: "OPEN" } }),
    prisma.platformIncident.count({ where: { businessId, status: "INVESTIGATING" } }),
    prisma.platformIncident.count({
      where: { businessId, status: { in: ["RESOLVED", "CLOSED"] } },
    }),
  ]);
  return { open, investigating, resolved };
}

export async function ensureDefaultIncidents(ownerId: string) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const existing = await prisma.platformIncident.count({ where: { businessId } });
  if (existing > 0) return;

  await createIncident(ownerId, {
    title: "Elevated API latency",
    description: "Developer API response times above baseline.",
    severity: "MEDIUM",
  });
}
