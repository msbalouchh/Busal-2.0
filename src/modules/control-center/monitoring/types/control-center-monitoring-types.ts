import type {
  MonitoringAlertStatus,
  MonitoringAlertType,
  MonitoringErrorType,
  MonitoringHealthStatus,
  MonitoringLogLevel,
} from "@prisma/client";

export interface ControlCenterMonitoringPermissions {
  canViewMonitoring: boolean;
  canViewLogs: boolean;
  canManageAlerts: boolean;
  canViewIncidents: boolean;
  canViewInfrastructure: boolean;
  canViewAiMonitoring: boolean;
}

export interface ControlCenterMonitoringDashboardWidgets {
  platformStatus: MonitoringHealthStatus | "OPERATIONAL" | "DEGRADED" | "OUTAGE";
  overallHealthScore: number;
  activeServices: number;
  serviceAvailabilityPct: number;
  uptimePct: number;
  currentIncidents: number;
  activeAlerts: number;
  systemLoadPct: number;
}

export interface ControlCenterServiceMonitorItem {
  key: string;
  name: string;
  status: MonitoringHealthStatus | "UNKNOWN";
  latencyMs: number;
  errorRatePct: number;
  throughput: number;
}

export interface ControlCenterInfrastructureMetrics {
  cpuUsagePct: number;
  memoryUsagePct: number;
  diskUsagePct: number;
  networkUsagePct: number;
  queueLength: number;
  workerCount: number;
  workerStatus: MonitoringHealthStatus | "UNKNOWN";
  capturedAt: string | null;
}

export interface ControlCenterApiMonitoringMetrics {
  requestVolume: number;
  avgResponseTimeMs: number;
  errorRatePct: number;
  successRatePct: number;
  slowEndpoints: Array<{ endpoint: string; avgMs: number; count: number }>;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  usageTrends: Array<{ hour: string; requests: number; errors: number }>;
}

export interface ControlCenterAiMonitoringMetrics {
  tokenUsage: number;
  avgResponseTimeMs: number;
  errorCount: number;
  queueLength: number;
  costTrendCents: number;
  modelPerformance: Array<{ model: string; avgMs: number; executions: number }>;
  usageTrends: Array<{ day: string; tokens: number }>;
}

export interface ControlCenterAlertItem {
  id: string;
  alertType: MonitoringAlertType;
  title: string;
  message: string;
  status: MonitoringAlertStatus;
  severity: string;
  businessId: string | null;
  businessName: string | null;
  triggeredAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  escalated: boolean;
}

export interface ControlCenterAlertQuery {
  status?: MonitoringAlertStatus | null;
  alertType?: MonitoringAlertType | null;
  page?: number;
  pageSize?: number;
}

export interface ControlCenterAlertDirectoryResult {
  items: ControlCenterAlertItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  rules: Array<{ alertType: MonitoringAlertType; count: number }>;
}

export interface ControlCenterLogItem {
  id: string;
  level: MonitoringLogLevel;
  message: string;
  source: string;
  businessId: string | null;
  businessName: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface ControlCenterLogQuery {
  search?: string;
  level?: MonitoringLogLevel | null;
  source?: string | null;
  businessId?: string | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  pageSize?: number;
}

export interface ControlCenterLogDirectoryResult {
  items: ControlCenterLogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ControlCenterIncidentItem {
  id: string;
  title: string;
  severity: MonitoringErrorType;
  status: string;
  rootCause: string | null;
  resolutionStatus: string;
  assignedStaff: string | null;
  businessId: string | null;
  businessName: string | null;
  createdAt: string;
  resolvedAt: string | null;
  timeline: Array<{ at: string; event: string }>;
}

export interface ControlCenterIncidentQuery {
  active?: boolean | null;
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

export interface ControlCenterMonitoringManagementBundle {
  widgets: ControlCenterMonitoringDashboardWidgets;
  permissions: ControlCenterMonitoringPermissions;
  services: ControlCenterServiceMonitorItem[];
  infrastructure: ControlCenterInfrastructureMetrics;
  apiMonitoring: ControlCenterApiMonitoringMetrics;
  aiMonitoring: ControlCenterAiMonitoringMetrics;
  alerts: ControlCenterAlertDirectoryResult;
  logs: ControlCenterLogDirectoryResult;
  incidents: ControlCenterIncidentDirectoryResult;
  refreshedAt: string;
}
