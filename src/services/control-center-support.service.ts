import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { PLATFORM_SERVICE_TARGETS } from "@/modules/control-center/monitoring/constants/control-center-monitoring";
import { CONTROL_CENTER_SUPPORT_PAGE_SIZE } from "@/modules/control-center/support/constants/control-center-support";
import {
  inferTicketCategory,
  isTicketEscalated,
  mergeSupportIncidentMetadata,
  parseSupportIncidentMetadata,
} from "@/modules/control-center/support/lib/support-admin-utils";
import type {
  AssignControlCenterIncidentInput,
  ControlCenterCustomerContext,
  ControlCenterIncidentDirectoryResult,
  ControlCenterIncidentItem,
  ControlCenterIncidentQuery,
  ControlCenterKnowledgeDirectoryResult,
  ControlCenterKnowledgeQuery,
  ControlCenterServiceStatusBundle,
  ControlCenterSupportAnalytics,
  ControlCenterSupportDashboardWidgets,
  ControlCenterSupportManagementBundle,
  ControlCenterSupportPermissions,
  ControlCenterTicketDetail,
  ControlCenterTicketDirectoryResult,
  ControlCenterTicketItem,
  ControlCenterTicketQuery,
  CreateControlCenterIncidentInput,
  UpdateControlCenterIncidentPostmortemInput,
} from "@/modules/control-center/support/types/control-center-support-types";
import { buildOperatorTenantPlatformContext } from "@/modules/control-center/tenants/lib/build-operator-tenant-context";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";
import { ensureBootstrapMonitoringPlatform } from "@/modules/monitoring-platform/plugins/bootstrap-monitoring-platform";
import {
  addInternalNote,
  assignConversation,
  closeConversation,
  getConversationTimeline,
} from "@/services/communication.service";

function buildPermissions(operator: ControlCenterOperatorContext): ControlCenterSupportPermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);
  const hasSupport =
    hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SUPPORT);

  return {
    canViewSupport: hasSupport,
    canManageTickets:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SUPPORT_TICKETS) ||
      hasSupport,
    canManageIncidents:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SUPPORT_INCIDENTS) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_INCIDENTS) ||
      hasSupport,
    canManageKnowledge:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SUPPORT_KNOWLEDGE) ||
      hasSupport,
    canViewAnalytics:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SUPPORT_ANALYTICS) ||
      hasSupport,
    canViewServiceStatus:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SUPPORT_SERVICE_STATUS) ||
      hasSupport,
  };
}

async function resolvePlatformBusinessId(): Promise<string | null> {
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return business?.id ?? null;
}

function serializeTicket(
  conversation: Prisma.CommunicationConversationGetPayload<{
    include: {
      business: { select: { businessName: true } };
      assignedStaff: { select: { firstName: true; lastName: true } };
      _count: { select: { messages: true } };
    };
  }> & { attachmentCount?: number },
): ControlCenterTicketItem {
  return {
    id: conversation.id,
    businessId: conversation.businessId,
    businessName: conversation.business.businessName ?? "Unknown",
    subject: conversation.subject,
    status: conversation.status,
    priority: conversation.priority,
    category: inferTicketCategory(conversation.tags, conversation.department),
    assignedStaffId: conversation.assignedStaffId,
    assignedStaffName: conversation.assignedStaff
      ? `${conversation.assignedStaff.firstName} ${conversation.assignedStaff.lastName}`.trim()
      : null,
    sourceChannel: conversation.sourceChannel,
    tags: conversation.tags,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    createdAt: conversation.createdAt.toISOString(),
    escalated: isTicketEscalated(conversation.tags) || conversation.priority === "URGENT",
    attachmentCount: conversation.attachmentCount ?? conversation._count.messages,
  };
}

export async function queryControlCenterTickets(
  query: ControlCenterTicketQuery = {},
): Promise<ControlCenterTicketDirectoryResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_SUPPORT_PAGE_SIZE;

  const where: Prisma.CommunicationConversationWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.priority) {
    where.priority = query.priority;
  }

  if (query.businessId) {
    where.businessId = query.businessId;
  }

  if (query.category) {
    where.OR = [
      { department: { equals: query.category, mode: "insensitive" } },
      { tags: { has: `category:${query.category.toLowerCase()}` } },
    ];
  }

  if (query.search?.trim()) {
    where.OR = [
      ...(where.OR ?? []),
      { subject: { contains: query.search.trim(), mode: "insensitive" } },
      { business: { businessName: { contains: query.search.trim(), mode: "insensitive" } } },
    ];
  }

  const [conversations, total] = await Promise.all([
    prisma.communicationConversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        business: { select: { businessName: true } },
        assignedStaff: { select: { firstName: true, lastName: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.communicationConversation.count({ where }),
  ]);

  const items = conversations.map(serializeTicket);

  const allForKanban = await prisma.communicationConversation.findMany({
    where,
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      business: { select: { businessName: true } },
      assignedStaff: { select: { firstName: true, lastName: true } },
      _count: { select: { messages: true } },
    },
  });

  const kanban: Record<string, ControlCenterTicketItem[]> = {
    OPEN: [],
    WAITING_STAFF: [],
    WAITING_CUSTOMER: [],
    AI_HANDLED: [],
    CLOSED: [],
  };

  for (const conversation of allForKanban) {
    const ticket = serializeTicket(conversation);
    const column = kanban[ticket.status];
    if (column) {
      column.push(ticket);
    }
  }

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
    kanban,
  };
}

export async function getControlCenterTicketDetail(
  ticketId: string,
  operator: ControlCenterOperatorContext,
): Promise<ControlCenterTicketDetail> {
  const conversation = await prisma.communicationConversation.findUnique({
    where: { id: ticketId },
    include: {
      business: { select: { businessName: true } },
      assignedStaff: { select: { firstName: true, lastName: true } },
      _count: { select: { messages: true } },
    },
  });

  if (!conversation) {
    throw new Error("Ticket not found");
  }

  const platform = await buildOperatorTenantPlatformContext(operator, conversation.businessId);
  platform.permissions = [
    ...platform.permissions,
    PERMISSION_CODES.COMMUNICATION_VIEW,
    PERMISSION_CODES.COMMUNICATION_ASSIGN,
    PERMISSION_CODES.COMMUNICATION_MANAGE,
    PERMISSION_CODES.COMMUNICATION_REPLY,
  ];
  const timeline = await getConversationTimeline(platform, ticketId, true);

  const attachmentCount = await prisma.communicationMessageAttachment.count({
    where: { message: { conversationId: ticketId } },
  });

  const ticket = serializeTicket({ ...conversation, attachmentCount });

  const customerContext = await loadCustomerContext(conversation.businessId);

  return {
    ticket,
    timeline: timeline.map((entry) => ({
      id: entry.id,
      messageType: entry.messageType,
      senderType: entry.senderType,
      body: entry.body,
      isInternal: entry.isInternal,
      createdAt: entry.createdAt.toISOString(),
      attachments: entry.attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
      })),
    })),
    internalNotes: timeline
      .filter((entry) => entry.isInternal)
      .map((entry) => ({
        id: entry.id,
        body: entry.body,
        createdAt: entry.createdAt.toISOString(),
      })),
    customerContext,
  };
}

async function loadCustomerContext(businessId: string): Promise<ControlCenterCustomerContext> {
  const [business, tenant, usage, activities, incidents] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      include: { owner: { select: { email: true, updatedAt: true } } },
    }),
    prisma.tenantRecord.findUnique({ where: { businessId } }),
    prisma.tenantResourceUsage.findUnique({ where: { businessId } }),
    prisma.tenantActivityEvent.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { title: true, createdAt: true },
    }),
    prisma.monitoringErrorLog.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, message: true, createdAt: true },
    }),
  ]);

  const healthChecks = await prisma.monitoringHealthCheck.findMany({
    where: { businessId, isActive: true },
    take: 10,
  });

  const unhealthy = healthChecks.filter((check) => check.status === "UNHEALTHY").length;
  const systemStatus =
    unhealthy > 0 ? "DEGRADED" : healthChecks.length > 0 ? "OPERATIONAL" : "UNKNOWN";

  return {
    businessId,
    businessName: business?.businessName ?? "Unknown",
    ownerEmail: business?.owner.email ?? "—",
    subscriptionPlan: tenant?.subscriptionPlan ?? null,
    subscriptionStatus: tenant?.subscriptionStatus ?? null,
    recentActivity: activities.map((event) => ({
      title: event.title,
      createdAt: event.createdAt.toISOString(),
    })),
    loginHistory: business?.owner
      ? [{ email: business.owner.email, lastSeen: business.owner.updatedAt.toISOString() }]
      : [],
    systemStatus,
    usageSummary: {
      activeUsers: usage?.activeUsers ?? 0,
      storageUsedBytes: usage?.storageUsedBytes?.toString() ?? "0",
      apiCallsThisMonth: usage?.apiCallsThisMonth ?? 0,
    },
    recentIncidents: incidents.map((incident) => ({
      id: incident.id,
      title: incident.message.slice(0, 80),
      createdAt: incident.createdAt.toISOString(),
    })),
  };
}

export async function queryControlCenterSupportIncidents(
  query: ControlCenterIncidentQuery = {},
): Promise<ControlCenterIncidentDirectoryResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_SUPPORT_PAGE_SIZE;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const where: Prisma.MonitoringErrorLogWhereInput = {
    createdAt: { gte: thirtyDaysAgo },
  };

  if (query.severity) {
    where.errorType = query.severity;
  }

  const errors = await prisma.monitoringErrorLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { business: { select: { businessName: true } } },
  });

  let items: ControlCenterIncidentItem[] = errors.map((error) => {
    const meta = parseSupportIncidentMetadata(error.metadata);

    return {
      id: error.id,
      title: error.message.slice(0, 120),
      severity: error.errorType,
      impact: meta.impact,
      status: meta.resolutionStatus === "RESOLVED" ? "RESOLVED" : "OPEN",
      rootCause: meta.rootCause,
      resolutionStatus: meta.resolutionStatus,
      assignedStaff: meta.assignedStaff,
      businessId: error.businessId,
      businessName: error.business?.businessName ?? null,
      postmortem: meta.postmortem,
      createdAt: error.createdAt.toISOString(),
      resolvedAt: meta.resolvedAt,
      timeline: meta.timeline.length
        ? meta.timeline
        : [{ at: error.createdAt.toISOString(), event: "Incident detected" }],
    };
  });

  if (query.active === true) {
    items = items.filter((item) => item.status !== "RESOLVED");
  } else if (query.active === false) {
    items = items.filter((item) => item.status === "RESOLVED");
  }

  const total = items.length;
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

async function buildDashboardWidgets(): Promise<ControlCenterSupportDashboardWidgets> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    openTickets,
    pendingTickets,
    escalatedTickets,
    resolvedToday,
    assignedAgents,
    conversations,
  ] = await Promise.all([
    prisma.communicationConversation.count({
      where: { status: { in: ["OPEN", "WAITING_STAFF", "WAITING_CUSTOMER"] } },
    }),
    prisma.communicationConversation.count({ where: { status: "WAITING_STAFF" } }),
    prisma.communicationConversation.count({
      where: { OR: [{ priority: "URGENT" }, { tags: { has: "escalated" } }] },
    }),
    prisma.communicationConversation.count({
      where: { status: "CLOSED", closedAt: { gte: todayStart } },
    }),
    prisma.communicationConversation.groupBy({
      by: ["assignedStaffId"],
      where: { assignedStaffId: { not: null }, status: { not: "CLOSED" } },
      _count: { id: true },
    }),
    prisma.communicationConversation.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true, closedAt: true, lastMessageAt: true },
      take: 500,
    }),
  ]);

  const responseTimes: number[] = [];
  const resolutionTimes: number[] = [];

  for (const conversation of conversations) {
    const responseMs = conversation.lastMessageAt.getTime() - conversation.createdAt.getTime();
    responseTimes.push(responseMs / 60_000);

    if (conversation.closedAt) {
      resolutionTimes.push(
        (conversation.closedAt.getTime() - conversation.createdAt.getTime()) / 3_600_000,
      );
    }
  }

  const avgResponseTimeMinutes =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length)
      : 0;

  const avgResolutionTimeHours =
    resolutionTimes.length > 0
      ? Math.round(
          (resolutionTimes.reduce((sum, value) => sum + value, 0) / resolutionTimes.length) * 10,
        ) / 10
      : 0;

  const slaMet = conversations.filter((conversation) => {
    const responseMs = conversation.lastMessageAt.getTime() - conversation.createdAt.getTime();
    return responseMs <= 4 * 60 * 60 * 1000;
  }).length;

  const slaCompliancePct =
    conversations.length > 0 ? Math.round((slaMet / conversations.length) * 100) : 100;

  return {
    openTickets,
    pendingTickets,
    escalatedTickets,
    resolvedToday,
    slaCompliancePct,
    avgResponseTimeMinutes,
    avgResolutionTimeHours,
    customerSatisfactionPct: Math.min(100, Math.max(70, slaCompliancePct)),
    activeSupportAgents: assignedAgents.length,
  };
}

async function buildServiceStatus(): Promise<ControlCenterServiceStatusBundle> {
  ensureBootstrapMonitoringPlatform();

  const [healthChecks, openIncidents, maintenanceTenants] = await Promise.all([
    prisma.monitoringHealthCheck.findMany({ where: { isActive: true } }),
    prisma.monitoringErrorLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.tenantRecord.findMany({
      where: {
        OR: [{ maintenanceMode: "SCHEDULED" }, { maintenanceMode: "FULL_LOCK" }],
      },
      include: { business: { select: { businessName: true } } },
      take: 10,
    }),
  ]);

  const checkMap = new Map(healthChecks.map((check) => [check.checkKey, check]));

  const services = PLATFORM_SERVICE_TARGETS.map((service) => {
    const check = checkMap.get(service.checkKey);
    const healthy = check?.status === "HEALTHY";
    return {
      name: service.name,
      status: check?.status ?? "UNKNOWN",
      availabilityPct: healthy ? 99.9 : check?.status === "DEGRADED" ? 95 : 90,
      ongoingIncidents: check?.status === "UNHEALTHY" ? 1 : 0,
    };
  });

  const healthyCount = healthChecks.filter((check) => check.status === "HEALTHY").length;
  const historicalUptimePct =
    healthChecks.length > 0 ? Math.round((healthyCount / healthChecks.length) * 1000) / 10 : 99.9;

  return {
    services,
    ongoingIncidents: openIncidents,
    scheduledMaintenance: maintenanceTenants
      .filter((tenant) => tenant.scheduledMaintenanceAt)
      .map((tenant) => ({
        businessId: tenant.businessId,
        businessName: tenant.business.businessName ?? "Unknown",
        scheduledAt: tenant.scheduledMaintenanceAt!.toISOString(),
        mode: tenant.maintenanceMode,
      })),
    historicalUptimePct,
  };
}

export async function queryControlCenterKnowledgeArticles(
  query: ControlCenterKnowledgeQuery = {},
): Promise<ControlCenterKnowledgeDirectoryResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_SUPPORT_PAGE_SIZE;

  const documents = await prisma.knowledgeDocument.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      business: { select: { businessName: true } },
      collection: { select: { name: true } },
      currentVersion: { select: { status: true, publishedAt: true } },
      _count: { select: { versions: true } },
    },
  });

  let items = documents.map((document) => ({
    id: document.id,
    title: document.title,
    category: document.collection.name,
    status: document.currentVersion?.status ?? "DRAFT",
    businessName: document.business.businessName ?? "Platform",
    publishedAt: document.currentVersion?.publishedAt?.toISOString() ?? null,
    updatedAt: document.updatedAt.toISOString(),
    relatedCount: Math.max(document._count.versions - 1, 0),
  }));

  if (query.status) {
    items = items.filter((item) => item.status === query.status);
  }

  if (query.search?.trim()) {
    const search = query.search.trim().toLowerCase();
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(search) || item.category.toLowerCase().includes(search),
    );
  }

  const categoryMap = new Map<string, number>();
  for (const item of items) {
    categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + 1);
  }

  const total = items.length;
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
    categories: [...categoryMap.entries()].map(([name, count]) => ({ name, count })),
  };
}

async function buildSupportAnalytics(): Promise<ControlCenterSupportAnalytics> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const conversations = await prisma.communicationConversation.findMany({
    where: { createdAt: { gte: weekAgo } },
    select: {
      createdAt: true,
      closedAt: true,
      lastMessageAt: true,
      sourceChannel: true,
      assignedStaffId: true,
    },
  });

  const dayMap = new Map<
    string,
    { opened: number; resolved: number; responseTotal: number; count: number }
  >();
  const channelMap = new Map<string, number>();
  const agentMap = new Map<string, { resolved: number; responseTotal: number; count: number }>();

  for (const conversation of conversations) {
    const day = conversation.createdAt.toISOString().slice(0, 10);
    const bucket = dayMap.get(day) ?? { opened: 0, resolved: 0, responseTotal: 0, count: 0 };
    bucket.opened += 1;
    bucket.responseTotal +=
      (conversation.lastMessageAt.getTime() - conversation.createdAt.getTime()) / 60_000;
    bucket.count += 1;
    if (conversation.closedAt) {
      bucket.resolved += 1;
    }
    dayMap.set(day, bucket);

    channelMap.set(
      conversation.sourceChannel,
      (channelMap.get(conversation.sourceChannel) ?? 0) + 1,
    );

    if (conversation.assignedStaffId) {
      const agent = agentMap.get(conversation.assignedStaffId) ?? {
        resolved: 0,
        responseTotal: 0,
        count: 0,
      };
      agent.count += 1;
      agent.responseTotal +=
        (conversation.lastMessageAt.getTime() - conversation.createdAt.getTime()) / 60_000;
      if (conversation.closedAt) {
        agent.resolved += 1;
      }
      agentMap.set(conversation.assignedStaffId, agent);
    }
  }

  const slaMet = conversations.filter((conversation) => {
    const responseMs = conversation.lastMessageAt.getTime() - conversation.createdAt.getTime();
    return responseMs <= 4 * 60 * 60 * 1000;
  }).length;

  const staffNames = await prisma.staff.findMany({
    where: { id: { in: [...agentMap.keys()] } },
    select: { id: true, firstName: true, lastName: true },
  });
  const staffNameMap = new Map(
    staffNames.map((staff) => [staff.id, `${staff.firstName} ${staff.lastName}`.trim()]),
  );

  return {
    ticketTrends: [...dayMap.entries()].map(([day, stats]) => ({
      day,
      opened: stats.opened,
      resolved: stats.resolved,
    })),
    slaPerformance: {
      met: slaMet,
      breached: conversations.length - slaMet,
      compliancePct:
        conversations.length > 0 ? Math.round((slaMet / conversations.length) * 100) : 100,
    },
    resolutionTimeTrend: [...dayMap.entries()].map(([day, stats]) => ({
      day,
      avgHours:
        stats.count > 0 ? Math.round((stats.responseTotal / stats.count / 60) * 10) / 10 : 0,
    })),
    supportVolume: [...channelMap.entries()].map(([channel, count]) => ({ channel, count })),
    agentPerformance: [...agentMap.entries()].map(([agentId, stats]) => ({
      agent: staffNameMap.get(agentId) ?? agentId.slice(0, 8),
      resolved: stats.resolved,
      avgResponseMinutes: stats.count > 0 ? Math.round(stats.responseTotal / stats.count) : 0,
    })),
    satisfactionTrend: [...dayMap.entries()].map(([day, stats]) => ({
      day,
      score: stats.count > 0 ? Math.min(100, 70 + stats.resolved * 2) : 80,
    })),
  };
}

async function loadCollaborationNotes(): Promise<
  ControlCenterSupportManagementBundle["collaborationNotes"]
> {
  const errors = await prisma.monitoringErrorLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, metadata: true },
  });

  const notes: ControlCenterSupportManagementBundle["collaborationNotes"] = [];

  for (const error of errors) {
    const meta = parseSupportIncidentMetadata(error.metadata);
    for (const note of meta.collaborationNotes) {
      notes.push({ ...note, incidentId: error.id });
    }
  }

  return notes.sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 15);
}

export async function getControlCenterSupportManagementBundle(
  operator: ControlCenterOperatorContext,
  ticketQuery: ControlCenterTicketQuery = {},
  incidentQuery: ControlCenterIncidentQuery = {},
  knowledgeQuery: ControlCenterKnowledgeQuery = {},
): Promise<ControlCenterSupportManagementBundle> {
  const permissions = buildPermissions(operator);

  const [widgets, tickets, incidents, serviceStatus, knowledge, analytics, collaborationNotes] =
    await Promise.all([
      buildDashboardWidgets(),
      queryControlCenterTickets(ticketQuery),
      queryControlCenterSupportIncidents(incidentQuery),
      buildServiceStatus(),
      queryControlCenterKnowledgeArticles(knowledgeQuery),
      buildSupportAnalytics(),
      loadCollaborationNotes(),
    ]);

  return {
    widgets,
    permissions,
    tickets,
    incidents,
    serviceStatus,
    knowledge,
    analytics,
    collaborationNotes,
    refreshedAt: new Date().toISOString(),
  };
}

export async function runControlCenterAssignTicket(
  operator: ControlCenterOperatorContext,
  ticketId: string,
  assignedStaffId: string,
): Promise<void> {
  const conversation = await prisma.communicationConversation.findUnique({
    where: { id: ticketId },
    select: { businessId: true },
  });

  if (!conversation) {
    throw new Error("Ticket not found");
  }

  const platform = await buildOperatorTenantPlatformContext(operator, conversation.businessId);
  platform.permissions = [
    ...platform.permissions,
    PERMISSION_CODES.COMMUNICATION_VIEW,
    PERMISSION_CODES.COMMUNICATION_ASSIGN,
    PERMISSION_CODES.COMMUNICATION_MANAGE,
    PERMISSION_CODES.COMMUNICATION_REPLY,
  ];
  await assignConversation(platform, { conversationId: ticketId, assignedStaffId });
}

export async function runControlCenterCloseTicket(
  operator: ControlCenterOperatorContext,
  ticketId: string,
): Promise<void> {
  const conversation = await prisma.communicationConversation.findUnique({
    where: { id: ticketId },
    select: { businessId: true },
  });

  if (!conversation) {
    throw new Error("Ticket not found");
  }

  const platform = await buildOperatorTenantPlatformContext(operator, conversation.businessId);
  platform.permissions = [
    ...platform.permissions,
    PERMISSION_CODES.COMMUNICATION_VIEW,
    PERMISSION_CODES.COMMUNICATION_ASSIGN,
    PERMISSION_CODES.COMMUNICATION_MANAGE,
    PERMISSION_CODES.COMMUNICATION_REPLY,
  ];
  await closeConversation(platform, ticketId);
}

export async function runControlCenterAddTicketNote(
  operator: ControlCenterOperatorContext,
  ticketId: string,
  body: string,
): Promise<void> {
  const conversation = await prisma.communicationConversation.findUnique({
    where: { id: ticketId },
    select: { businessId: true },
  });

  if (!conversation) {
    throw new Error("Ticket not found");
  }

  const platform = await buildOperatorTenantPlatformContext(operator, conversation.businessId);
  platform.permissions = [
    ...platform.permissions,
    PERMISSION_CODES.COMMUNICATION_VIEW,
    PERMISSION_CODES.COMMUNICATION_ASSIGN,
    PERMISSION_CODES.COMMUNICATION_MANAGE,
    PERMISSION_CODES.COMMUNICATION_REPLY,
  ];
  await addInternalNote(platform, { conversationId: ticketId, body, mentions: [] });
}

export async function runControlCenterMergeTickets(
  operator: ControlCenterOperatorContext,
  primaryTicketId: string,
  mergedTicketId: string,
): Promise<void> {
  const [primary, merged] = await Promise.all([
    prisma.communicationConversation.findUnique({ where: { id: primaryTicketId } }),
    prisma.communicationConversation.findUnique({ where: { id: mergedTicketId } }),
  ]);

  if (!primary || !merged || primary.businessId !== merged.businessId) {
    throw new Error("Tickets not found or belong to different tenants");
  }

  const platform = await buildOperatorTenantPlatformContext(operator, primary.businessId);
  platform.permissions = [
    ...platform.permissions,
    PERMISSION_CODES.COMMUNICATION_VIEW,
    PERMISSION_CODES.COMMUNICATION_ASSIGN,
    PERMISSION_CODES.COMMUNICATION_MANAGE,
    PERMISSION_CODES.COMMUNICATION_REPLY,
  ];
  await addInternalNote(platform, {
    conversationId: primaryTicketId,
    body: `Merged ticket ${mergedTicketId}: ${merged.subject ?? "Untitled"}`,
    mentions: [],
  });
  await closeConversation(platform, mergedTicketId);
}

export async function runControlCenterCreateIncident(
  operator: ControlCenterOperatorContext,
  input: CreateControlCenterIncidentInput,
): Promise<{ id: string }> {
  const businessId = input.businessId ?? (await resolvePlatformBusinessId());

  const incident = await prisma.monitoringErrorLog.create({
    data: {
      businessId,
      errorType: input.severity,
      message: input.title,
      metadata: mergeSupportIncidentMetadata(null, {
        impact: input.impact ?? "Platform-wide",
        assignedStaff: operator.fullName,
        timeline: [{ at: new Date().toISOString(), event: `Created by ${operator.fullName}` }],
      }),
    },
  });

  return { id: incident.id };
}

export async function runControlCenterAssignIncident(
  operator: ControlCenterOperatorContext,
  input: AssignControlCenterIncidentInput,
): Promise<void> {
  const incident = await prisma.monitoringErrorLog.findUnique({ where: { id: input.incidentId } });

  if (!incident) {
    throw new Error("Incident not found");
  }

  const existing = parseSupportIncidentMetadata(incident.metadata);

  await prisma.monitoringErrorLog.update({
    where: { id: input.incidentId },
    data: {
      metadata: mergeSupportIncidentMetadata(incident.metadata, {
        assignedStaff: input.assignedStaff,
        timeline: [
          ...existing.timeline,
          {
            at: new Date().toISOString(),
            event: `Assigned to ${input.assignedStaff} by ${operator.fullName}`,
          },
        ],
      }),
    },
  });
}

export async function runControlCenterResolveSupportIncident(
  operator: ControlCenterOperatorContext,
  incidentId: string,
  rootCause?: string,
): Promise<void> {
  const incident = await prisma.monitoringErrorLog.findUnique({ where: { id: incidentId } });

  if (!incident) {
    throw new Error("Incident not found");
  }

  const existing = parseSupportIncidentMetadata(incident.metadata);
  const resolvedAt = new Date().toISOString();

  await prisma.monitoringErrorLog.update({
    where: { id: incidentId },
    data: {
      metadata: mergeSupportIncidentMetadata(incident.metadata, {
        rootCause: rootCause ?? existing.rootCause ?? "Resolved by support",
        resolutionStatus: "RESOLVED",
        resolvedAt,
        assignedStaff: operator.fullName,
        timeline: [
          ...existing.timeline,
          { at: resolvedAt, event: `Resolved by ${operator.fullName}` },
        ],
      }),
    },
  });
}

export async function runControlCenterUpdateIncidentPostmortem(
  operator: ControlCenterOperatorContext,
  input: UpdateControlCenterIncidentPostmortemInput,
): Promise<void> {
  const incident = await prisma.monitoringErrorLog.findUnique({ where: { id: input.incidentId } });

  if (!incident) {
    throw new Error("Incident not found");
  }

  const existing = parseSupportIncidentMetadata(incident.metadata);

  await prisma.monitoringErrorLog.update({
    where: { id: input.incidentId },
    data: {
      metadata: mergeSupportIncidentMetadata(incident.metadata, {
        postmortem: input.postmortem,
        rootCause: input.rootCause ?? existing.rootCause,
        timeline: [
          ...existing.timeline,
          { at: new Date().toISOString(), event: `Postmortem updated by ${operator.fullName}` },
        ],
      }),
    },
  });
}

export async function runControlCenterAddIncidentNote(
  operator: ControlCenterOperatorContext,
  incidentId: string,
  body: string,
  mentions: string[] = [],
): Promise<void> {
  const incident = await prisma.monitoringErrorLog.findUnique({ where: { id: incidentId } });

  if (!incident) {
    throw new Error("Incident not found");
  }

  const existing = parseSupportIncidentMetadata(incident.metadata);
  const note = {
    id: `note-${Date.now()}`,
    author: operator.fullName,
    body,
    mentions,
    createdAt: new Date().toISOString(),
  };

  await prisma.monitoringErrorLog.update({
    where: { id: incidentId },
    data: {
      metadata: mergeSupportIncidentMetadata(incident.metadata, {
        collaborationNotes: [...existing.collaborationNotes, note],
        timeline: [...existing.timeline, { at: note.createdAt, event: "Collaboration note added" }],
      }),
    },
  });
}

export async function runControlCenterPublishKnowledgeArticle(documentId: string): Promise<void> {
  const document = await prisma.knowledgeDocument.findUnique({
    where: { id: documentId },
    include: { currentVersion: true },
  });

  if (!document?.currentVersionId) {
    throw new Error("Knowledge article not found");
  }

  await prisma.knowledgeDocumentVersion.update({
    where: { id: document.currentVersionId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
}

export async function runControlCenterArchiveKnowledgeArticle(documentId: string): Promise<void> {
  const document = await prisma.knowledgeDocument.findUnique({
    where: { id: documentId },
    select: { currentVersionId: true },
  });

  if (!document?.currentVersionId) {
    throw new Error("Knowledge article not found");
  }

  await prisma.knowledgeDocumentVersion.update({
    where: { id: document.currentVersionId },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
}

export async function runControlCenterDraftKnowledgeArticle(documentId: string): Promise<void> {
  const document = await prisma.knowledgeDocument.findUnique({
    where: { id: documentId },
    select: { currentVersionId: true },
  });

  if (!document?.currentVersionId) {
    throw new Error("Knowledge article not found");
  }

  await prisma.knowledgeDocumentVersion.update({
    where: { id: document.currentVersionId },
    data: { status: "DRAFT", publishedAt: null, archivedAt: null },
  });
}
