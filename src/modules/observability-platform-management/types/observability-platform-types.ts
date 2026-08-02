import type {
  PlatformIncidentSeverity,
  PlatformIncidentStatus,
  PlatformObservabilityAlertStatus,
  PlatformObservabilityLogLevel,
} from "@prisma/client";

export interface ObservabilitySummaryRecord {
  overallStatus: "healthy" | "degraded" | "down";
  errorRate: number;
  metrics24h: number;
  logs24h: number;
  activeAlerts: number;
  openIncidents: number;
  traceCount: number;
}

export interface MetricRecord {
  id: string;
  service: string;
  metric: string;
  value: number;
  unit: string;
  recordedAt: string;
}

export interface LogRecord {
  id: string;
  level: PlatformObservabilityLogLevel;
  service: string;
  category: string;
  message: string;
  createdAt: string;
}

export interface IncidentRecord {
  id: string;
  title: string;
  description: string;
  severity: PlatformIncidentSeverity;
  status: PlatformIncidentStatus;
  assignedTo: string;
  startedAt: string;
  resolvedAt: string | null;
}

export interface AlertRecord {
  id: string;
  name: string;
  condition: string;
  severity: PlatformIncidentSeverity;
  status: PlatformObservabilityAlertStatus;
  triggeredAt: string;
  resolvedAt: string | null;
}

export interface ServiceHealthRecord {
  service: string;
  status: "healthy" | "degraded" | "down";
  errorRate: number;
  lastSeen: string | null;
}

export interface TraceRecord {
  id: string;
  traceId: string;
  spanId: string;
  service: string;
  operation: string;
  durationMs: number;
  status: string;
  createdAt: string;
}

export interface AuditTimelineRecord {
  id: string;
  source: string;
  action: string;
  message: string;
  createdAt: string;
}

export interface PerformanceSummaryRecord {
  avgLatencyMs: number;
  totalThroughput: number;
  byService: Array<{ service: string; avgValue: number; maxValue: number }>;
}
