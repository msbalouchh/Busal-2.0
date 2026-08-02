import type {
  CommunicationConversationStatus,
  CommunicationPriority,
  KnowledgeDocumentStatus,
  MonitoringErrorType,
} from "@prisma/client";

export interface ControlCenterSupportPermissions {
  canViewSupport: boolean;
  canManageTickets: boolean;
  canManageIncidents: boolean;
  canManageKnowledge: boolean;
  canViewAnalytics: boolean;
  canViewServiceStatus: boolean;
}

export interface ControlCenterSupportDashboardWidgets {
  openTickets: number;
  pendingTickets: number;
  escalatedTickets: number;
  resolvedToday: number;
  slaCompliancePct: number;
  avgResponseTimeMinutes: number;
  avgResolutionTimeHours: number;
  customerSatisfactionPct: number;
  activeSupportAgents: number;
}

export interface ControlCenterTicketItem {
  id: string;
  businessId: string;
  businessName: string;
  subject: string | null;
  status: CommunicationConversationStatus;
  priority: CommunicationPriority;
  category: string;
  assignedStaffId: string | null;
  assignedStaffName: string | null;
  sourceChannel: string;
  tags: string[];
  lastMessageAt: string;
  createdAt: string;
  escalated: boolean;
  attachmentCount: number;
}

export interface ControlCenterTicketQuery {
  search?: string;
  status?: CommunicationConversationStatus | null;
  priority?: CommunicationPriority | null;
  category?: string | null;
  businessId?: string | null;
  page?: number;
  pageSize?: number;
}

export interface ControlCenterTicketDirectoryResult {
  items: ControlCenterTicketItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  kanban: Record<string, ControlCenterTicketItem[]>;
}

export interface ControlCenterTicketDetail {
  ticket: ControlCenterTicketItem;
  timeline: Array<{
    id: string;
    messageType: string;
    senderType: string;
    body: string;
    isInternal: boolean;
    createdAt: string;
    attachments: Array<{ id: string; fileName: string }>;
  }>;
  internalNotes: Array<{ id: string; body: string; createdAt: string }>;
  customerContext: ControlCenterCustomerContext | null;
}

export interface ControlCenterCustomerContext {
  businessId: string;
  businessName: string;
  ownerEmail: string;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  recentActivity: Array<{ title: string; createdAt: string }>;
  loginHistory: Array<{ email: string; lastSeen: string }>;
  systemStatus: string;
  usageSummary: {
    activeUsers: number;
    storageUsedBytes: string;
    apiCallsThisMonth: number;
  };
  recentIncidents: Array<{ id: string; title: string; createdAt: string }>;
}

export interface ControlCenterIncidentItem {
  id: string;
  title: string;
  severity: MonitoringErrorType;
  impact: string | null;
  status: string;
  rootCause: string | null;
  resolutionStatus: string;
  assignedStaff: string | null;
  businessId: string | null;
  businessName: string | null;
  postmortem: string | null;
  createdAt: string;
  resolvedAt: string | null;
  timeline: Array<{ at: string; event: string }>;
}

export interface ControlCenterIncidentQuery {
  active?: boolean | null;
  severity?: MonitoringErrorType | null;
  page?: number;
  pageSize?: number;
}

export interface ControlCenterIncidentDirectoryResult {
  items: ControlCenterIncidentItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ControlCenterServiceStatusItem {
  name: string;
  status: string;
  availabilityPct: number;
  ongoingIncidents: number;
}

export interface ControlCenterServiceStatusBundle {
  services: ControlCenterServiceStatusItem[];
  ongoingIncidents: number;
  scheduledMaintenance: Array<{
    businessId: string;
    businessName: string;
    scheduledAt: string;
    mode: string;
  }>;
  historicalUptimePct: number;
}

export interface ControlCenterKnowledgeArticleItem {
  id: string;
  title: string;
  category: string;
  status: KnowledgeDocumentStatus;
  businessName: string;
  publishedAt: string | null;
  updatedAt: string;
  relatedCount: number;
}

export interface ControlCenterKnowledgeQuery {
  search?: string;
  status?: KnowledgeDocumentStatus | null;
  page?: number;
  pageSize?: number;
}

export interface ControlCenterKnowledgeDirectoryResult {
  items: ControlCenterKnowledgeArticleItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categories: Array<{ name: string; count: number }>;
}

export interface ControlCenterSupportAnalytics {
  ticketTrends: Array<{ day: string; opened: number; resolved: number }>;
  slaPerformance: { met: number; breached: number; compliancePct: number };
  resolutionTimeTrend: Array<{ day: string; avgHours: number }>;
  supportVolume: Array<{ channel: string; count: number }>;
  agentPerformance: Array<{ agent: string; resolved: number; avgResponseMinutes: number }>;
  satisfactionTrend: Array<{ day: string; score: number }>;
}

export interface ControlCenterSupportManagementBundle {
  widgets: ControlCenterSupportDashboardWidgets;
  permissions: ControlCenterSupportPermissions;
  tickets: ControlCenterTicketDirectoryResult;
  incidents: ControlCenterIncidentDirectoryResult;
  serviceStatus: ControlCenterServiceStatusBundle;
  knowledge: ControlCenterKnowledgeDirectoryResult;
  analytics: ControlCenterSupportAnalytics;
  collaborationNotes: Array<{
    id: string;
    incidentId: string;
    author: string;
    body: string;
    mentions: string[];
    createdAt: string;
  }>;
  refreshedAt: string;
}

export interface CreateControlCenterIncidentInput {
  title: string;
  severity: MonitoringErrorType;
  impact?: string;
  businessId?: string | null;
}

export interface AssignControlCenterIncidentInput {
  incidentId: string;
  assignedStaff: string;
}

export interface UpdateControlCenterIncidentPostmortemInput {
  incidentId: string;
  postmortem: string;
  rootCause?: string;
}
