import type { Prisma } from "@prisma/client";

export interface SupportIncidentMetadata {
  rootCause: string | null;
  resolutionStatus: string;
  assignedStaff: string | null;
  resolvedAt: string | null;
  impact: string | null;
  postmortem: string | null;
  escalated: boolean;
  timeline: Array<{ at: string; event: string }>;
  collaborationNotes: Array<{
    id: string;
    author: string;
    body: string;
    mentions: string[];
    createdAt: string;
  }>;
}

export function parseSupportIncidentMetadata(
  metadata: Prisma.JsonValue | null,
): SupportIncidentMetadata {
  const record =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};

  const timeline = Array.isArray(record.timeline)
    ? record.timeline
        .filter(
          (entry): entry is { at: string; event: string } =>
            typeof entry === "object" &&
            entry != null &&
            typeof (entry as { at?: unknown }).at === "string" &&
            typeof (entry as { event?: unknown }).event === "string",
        )
        .map((entry) => ({ at: entry.at, event: entry.event }))
    : [];

  const collaborationNotes = Array.isArray(record.collaborationNotes)
    ? record.collaborationNotes
        .filter(
          (entry): entry is SupportIncidentMetadata["collaborationNotes"][number] =>
            typeof entry === "object" &&
            entry != null &&
            typeof (entry as { id?: unknown }).id === "string" &&
            typeof (entry as { body?: unknown }).body === "string",
        )
        .map((entry) => ({
          id: entry.id,
          author: typeof entry.author === "string" ? entry.author : "Operator",
          body: entry.body,
          mentions: Array.isArray(entry.mentions)
            ? entry.mentions.filter((value): value is string => typeof value === "string")
            : [],
          createdAt:
            typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString(),
        }))
    : [];

  return {
    rootCause: typeof record.rootCause === "string" ? record.rootCause : null,
    resolutionStatus:
      typeof record.resolutionStatus === "string" ? record.resolutionStatus : "OPEN",
    assignedStaff: typeof record.assignedStaff === "string" ? record.assignedStaff : null,
    resolvedAt: typeof record.resolvedAt === "string" ? record.resolvedAt : null,
    impact: typeof record.impact === "string" ? record.impact : null,
    postmortem: typeof record.postmortem === "string" ? record.postmortem : null,
    escalated: record.escalated === true,
    timeline,
    collaborationNotes,
  };
}

export function mergeSupportIncidentMetadata(
  metadata: Prisma.JsonValue | null,
  patch: Partial<SupportIncidentMetadata & Record<string, unknown>>,
): Prisma.InputJsonValue {
  const current = parseSupportIncidentMetadata(metadata);
  return { ...current, ...patch } as Prisma.InputJsonValue;
}

export function inferTicketCategory(tags: string[], department: string | null): string {
  const tagCategory = tags.find((tag) => tag.startsWith("category:"))?.replace("category:", "");
  if (tagCategory) {
    return tagCategory.toUpperCase();
  }

  if (department) {
    return department.toUpperCase();
  }

  return "GENERAL";
}

export function isTicketEscalated(tags: string[]): boolean {
  return tags.includes("escalated") || tags.includes("priority:urgent");
}
