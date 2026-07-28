import type {
  MonitoringAlertChannel,
  MonitoringAlertStatus,
  MonitoringAlertType,
  MonitoringAuditEventType,
  MonitoringErrorType,
  MonitoringHealthStatus,
  MonitoringHealthTargetType,
  MonitoringLogLevel,
  MonitoringPerformanceCategory,
} from "@prisma/client";

export interface RegisteredHealthCheckDefinition {
  checkKey: string;
  name: string;
  targetType: MonitoringHealthTargetType;
  serviceTarget: string;
  metadata?: Record<string, unknown>;
  isActive: boolean;
}

export interface MetricSnapshotInput {
  snapshotKey?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  networkUsage?: number;
  databaseConnections?: number;
  activeSessions?: number;
  queueLength?: number;
  backgroundJobs?: number;
  cacheHitRate?: number | null;
  storageUsageBytes?: bigint | number | null;
  metadata?: Record<string, unknown>;
}

export interface PerformanceLogInput {
  category: MonitoringPerformanceCategory;
  operationKey: string;
  durationMs: number;
  correlationId?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ErrorLogInput {
  errorType: MonitoringErrorType;
  message: string;
  stackTrace?: string | null;
  correlationId?: string | null;
  requestId?: string | null;
  branchId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface StructuredLogInput {
  level: MonitoringLogLevel;
  message: string;
  source: string;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface TriggerAlertInput {
  alertType: MonitoringAlertType;
  title: string;
  message: string;
  channels?: MonitoringAlertChannel[];
  metadata?: Record<string, unknown>;
}

export interface RetentionPolicyInput {
  name: string;
  logRetentionDays?: number;
  metricsRetentionDays?: number;
  alertHistoryDays?: number;
  archiveEnabled?: boolean;
}

export interface MonitoringPlatformDashboardMetrics {
  totalHealthChecks: number;
  healthyChecks: number;
  degradedChecks: number;
  unhealthyChecks: number;
  activeAlerts: number;
  recentErrors: number;
  recentLogs: number;
  avgResponseTimeMs: number;
  slowRequests: number;
  registeredChecks: number;
  openAlertCount: number;
}

export interface HealthCheckView {
  id: string;
  checkKey: string;
  name: string;
  targetType: MonitoringHealthTargetType;
  serviceTarget: string;
  status: MonitoringHealthStatus;
  lastCheckedAt: string | null;
  isActive: boolean;
}

export interface MetricSnapshotView {
  id: string;
  snapshotKey: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkUsage: number;
  databaseConnections: number;
  activeSessions: number;
  queueLength: number;
  backgroundJobs: number;
  capturedAt: string;
}

export interface PerformanceLogView {
  id: string;
  category: MonitoringPerformanceCategory;
  operationKey: string;
  durationMs: number;
  isSlow: boolean;
  createdAt: string;
}

export interface ErrorLogView {
  id: string;
  errorType: MonitoringErrorType;
  message: string;
  correlationId: string | null;
  requestId: string | null;
  createdAt: string;
}

export interface StructuredLogView {
  id: string;
  level: MonitoringLogLevel;
  message: string;
  source: string;
  correlationId: string | null;
  createdAt: string;
}

export interface AlertView {
  id: string;
  alertType: MonitoringAlertType;
  title: string;
  message: string;
  status: MonitoringAlertStatus;
  channels: MonitoringAlertChannel[];
  triggeredAt: string;
}

export interface RetentionPolicyView {
  id: string;
  name: string;
  logRetentionDays: number;
  metricsRetentionDays: number;
  alertHistoryDays: number;
  archiveEnabled: boolean;
}

export interface MonitoringAuditLogView {
  id: string;
  eventType: MonitoringAuditEventType;
  createdAt: string;
}

export interface HealthEndpointResult {
  status: MonitoringHealthStatus;
  checks: Array<{
    checkKey: string;
    name: string;
    targetType: MonitoringHealthTargetType;
    status: MonitoringHealthStatus;
  }>;
  timestamp: string;
}
