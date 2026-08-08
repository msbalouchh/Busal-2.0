import type {
  PLATFORM_AUTOMATION_ACTION_TYPES,
  PLATFORM_AUTOMATION_AUDIT_EVENTS,
  PLATFORM_AUTOMATION_CATEGORIES,
  PLATFORM_AUTOMATION_CONDITION_FIELDS,
  PLATFORM_AUTOMATION_CONDITION_OPERATORS,
  PLATFORM_AUTOMATION_EXECUTION_STATUSES,
  PLATFORM_AUTOMATION_PRIORITIES,
  PLATFORM_AUTOMATION_STATUSES,
  PLATFORM_AUTOMATION_TRIGGERS,
} from "@/modules/control-center/automation/constants/control-center-platform-automation";

export type PlatformAutomationCategory = (typeof PLATFORM_AUTOMATION_CATEGORIES)[number];
export type PlatformAutomationStatus = (typeof PLATFORM_AUTOMATION_STATUSES)[number];
export type PlatformAutomationPriority = (typeof PLATFORM_AUTOMATION_PRIORITIES)[number];
export type PlatformAutomationTriggerType = (typeof PLATFORM_AUTOMATION_TRIGGERS)[number];
export type PlatformAutomationConditionOperator =
  (typeof PLATFORM_AUTOMATION_CONDITION_OPERATORS)[number];
export type PlatformAutomationConditionField = (typeof PLATFORM_AUTOMATION_CONDITION_FIELDS)[number];
export type PlatformAutomationActionType = (typeof PLATFORM_AUTOMATION_ACTION_TYPES)[number];
export type PlatformAutomationExecutionStatus =
  (typeof PLATFORM_AUTOMATION_EXECUTION_STATUSES)[number];
export type PlatformAutomationAuditEvent = (typeof PLATFORM_AUTOMATION_AUDIT_EVENTS)[number];

export interface PlatformAutomationTriggerConfig {
  type: PlatformAutomationTriggerType;
  event?: string;
  schedule?: string;
  configuration: Record<string, unknown>;
}

export interface PlatformAutomationCondition {
  id: string;
  operator: PlatformAutomationConditionOperator;
  field: PlatformAutomationConditionField | string;
  value: string;
}

export interface PlatformAutomationAction {
  id: string;
  type: PlatformAutomationActionType | string;
  order: number;
  configuration: Record<string, unknown>;
}

export interface PlatformAutomationSummary {
  id: string;
  name: string;
  description: string;
  category: PlatformAutomationCategory;
  status: PlatformAutomationStatus;
  priority: PlatformAutomationPriority;
  triggerType: PlatformAutomationTriggerType;
  enabled: boolean;
  ownerId: string | null;
  ownerEmail: string | null;
  businessId: string | null;
  businessName: string | null;
  actionCount: number;
  conditionCount: number;
  lastExecutedAt: string | null;
  executionCount: number;
  successRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformAutomationDetail extends PlatformAutomationSummary {
  trigger: PlatformAutomationTriggerConfig;
  conditions: PlatformAutomationCondition[];
  actions: PlatformAutomationAction[];
  createdById: string;
}

export interface PlatformAutomationExecutionLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  metadata?: Record<string, unknown>;
}

export interface PlatformAutomationExecutionSummary {
  id: string;
  automationId: string;
  automationName: string;
  status: PlatformAutomationExecutionStatus;
  triggerType: PlatformAutomationTriggerType | string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  error: string | null;
  triggeredById: string | null;
  triggeredByEmail: string | null;
  businessId: string | null;
  businessName: string | null;
}

export interface PlatformAutomationExecutionDetail extends PlatformAutomationExecutionSummary {
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  logs: PlatformAutomationExecutionLogEntry[];
}

export interface PlatformAutomationAuditEntry {
  id: string;
  automationId: string | null;
  automationName: string | null;
  executionId: string | null;
  eventType: PlatformAutomationAuditEvent | string;
  actorId: string;
  actorEmail: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PlatformAutomationOverview {
  totalAutomations: number;
  running: number;
  paused: number;
  failedExecutionsToday: number;
  executionsToday: number;
  successRate: number;
  averageExecutionMs: number;
  activeCategories: number;
}

export interface PlatformAutomationManagementQuery {
  search?: string;
  category?: PlatformAutomationCategory;
  status?: PlatformAutomationStatus;
  trigger?: PlatformAutomationTriggerType;
  priority?: PlatformAutomationPriority;
  ownerId?: string;
  businessId?: string;
  page?: number;
}

export interface PlatformAutomationExecutionQuery {
  search?: string;
  automationId?: string;
  status?: PlatformAutomationExecutionStatus;
  businessId?: string;
  page?: number;
}

export interface PlatformAutomationAuditQuery {
  automationId?: string;
  executionId?: string;
  eventType?: string;
  page?: number;
}

export interface PlatformAutomationDirectoryResult {
  items: PlatformAutomationSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PlatformAutomationExecutionDirectoryResult {
  items: PlatformAutomationExecutionSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PlatformAutomationAuditDirectoryResult {
  items: PlatformAutomationAuditEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PlatformAutomationFilterOptions {
  categories: PlatformAutomationCategory[];
  statuses: PlatformAutomationStatus[];
  triggers: PlatformAutomationTriggerType[];
  priorities: PlatformAutomationPriority[];
  owners: Array<{ id: string; email: string; name: string }>;
  businesses: Array<{ id: string; name: string }>;
}

export interface PlatformAutomationPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExecute: boolean;
  canExport: boolean;
  canEmergencyStop: boolean;
  isPlatformOwner: boolean;
}

export interface PlatformAutomationManagementBundle {
  overview: PlatformAutomationOverview;
  directory: PlatformAutomationDirectoryResult;
  executions: PlatformAutomationExecutionDirectoryResult;
  auditTrail: PlatformAutomationAuditDirectoryResult;
  filterOptions: PlatformAutomationFilterOptions;
  permissions: PlatformAutomationPermissions;
  refreshedAt: string;
}

export interface CreatePlatformAutomationInput {
  name: string;
  description?: string;
  category: PlatformAutomationCategory;
  priority?: PlatformAutomationPriority;
  trigger: PlatformAutomationTriggerConfig;
  conditions?: PlatformAutomationCondition[];
  actions: PlatformAutomationAction[];
  businessId?: string | null;
  enabled?: boolean;
}

export interface UpdatePlatformAutomationInput {
  name?: string;
  description?: string;
  category?: PlatformAutomationCategory;
  priority?: PlatformAutomationPriority;
  trigger?: PlatformAutomationTriggerConfig;
  conditions?: PlatformAutomationCondition[];
  actions?: PlatformAutomationAction[];
  businessId?: string | null;
  enabled?: boolean;
  status?: PlatformAutomationStatus;
}

export interface PlatformAutomationExportPayload {
  exportedAt: string;
  automations: PlatformAutomationDetail[];
  executions: PlatformAutomationExecutionDetail[];
  auditTrail: PlatformAutomationAuditEntry[];
}
