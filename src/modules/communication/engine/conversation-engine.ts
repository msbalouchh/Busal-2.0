import type { CommunicationConversationStatus, CommunicationInboxType } from "@prisma/client";

import type { InboxFilterInput } from "@/modules/communication/types/communication-types";

export function resolveInboxStatusFilter(
  filter: InboxFilterInput["filter"],
): CommunicationConversationStatus | undefined {
  switch (filter) {
    case "waiting_customer":
      return "WAITING_CUSTOMER";
    case "waiting_staff":
      return "WAITING_STAFF";
    case "ai_handled":
      return "AI_HANDLED";
    case "closed":
      return "CLOSED";
    default:
      return undefined;
  }
}

export function buildInboxWhereClause(input: InboxFilterInput & { businessId: string }) {
  const status = resolveInboxStatusFilter(input.filter);

  return {
    businessId: input.businessId,
    ...(input.inboxType ? { inboxType: input.inboxType } : {}),
    ...(status ? { status } : {}),
    ...(input.filter === "assigned" ? { assignedStaffId: { not: null } } : {}),
    ...(input.assignedStaffId ? { assignedStaffId: input.assignedStaffId } : {}),
    ...(input.department ? { department: input.department } : {}),
    ...(input.teamSlug ? { teamSlug: input.teamSlug } : {}),
  };
}

export function resolveInboxTypeFromRoute(route: string): CommunicationInboxType | undefined {
  if (route.includes("personal")) return "PERSONAL";
  if (route.includes("team")) return "TEAM";
  if (route.includes("department")) return "DEPARTMENT";
  if (route.includes("ai")) return "AI";
  return undefined;
}

export function mergeTimelineMessages<T extends { createdAt: Date; isInternal?: boolean }>(
  messages: T[],
  includeInternal: boolean,
): T[] {
  const filtered = includeInternal ? messages : messages.filter((m) => !m.isInternal);
  return [...filtered].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
