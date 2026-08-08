import type { AutomationEventCategory } from "@prisma/client";

import type {
  DomainEventAction,
  DomainEventModule,
} from "@/modules/platform-orchestration/constants/domain-events";

/** Canonical domain event envelope passed through the bus. */
export interface DomainEventEnvelope {
  id?: string;
  version: number;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  action: DomainEventAction;
  occurredAt: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
  sourceModule: DomainEventModule;
  category: AutomationEventCategory;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
  correlationId?: string;
  causationId?: string;
}

export interface DomainEventHandlerResult {
  subscriber: string;
  success: boolean;
  durationMs: number;
  error?: string;
  output?: Record<string, unknown>;
}

export interface DomainEventDispatchResult {
  eventId: string;
  eventType: string;
  duplicate: boolean;
  syncResults: DomainEventHandlerResult[];
  queuedJobIds: string[];
}

export interface OrchestrationTenantScope {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
}

export interface OrchestrationJob {
  id: string;
  type: OrchestrationJobType;
  eventId: string;
  eventType: string;
  subscriber: string;
  status: OrchestrationJobStatus;
  attemptCount: number;
  maxAttempts: number;
  payload: Record<string, unknown>;
  scope: OrchestrationTenantScope;
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  lastError: string | null;
  nextRetryAt: string | null;
  createdAt: string;
}

export type OrchestrationJobType =
  | "notification"
  | "email"
  | "sms"
  | "whatsapp"
  | "webhook"
  | "analytics"
  | "ai"
  | "export"
  | "report"
  | "integration";

export type OrchestrationJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "retry"
  | "dead_letter";

export interface OrchestrationMetrics {
  totalEvents: number;
  totalJobs: number;
  pendingJobs: number;
  deadLetterCount: number;
  averageDispatchMs: number;
  successRateBps: number;
  lastProcessedAt: string | null;
}

export interface StoredOrchestrationBranchMeta {
  idempotencyKeys: string[];
  jobs: OrchestrationJob[];
  deadLetter: OrchestrationJob[];
  metrics: OrchestrationMetrics;
  aiContextSnapshots: Array<{
    eventType: string;
    aggregateId: string;
    snapshot: Record<string, unknown>;
    updatedAt: string;
  }>;
}

export type DomainEventSubscriberHandler = (
  event: DomainEventEnvelope,
) => Promise<Record<string, unknown> | void>;

export interface DomainEventSubscriberRegistration {
  subscriberId: string;
  eventPattern: string;
  module: DomainEventModule;
  async: boolean;
  jobType?: OrchestrationJobType;
  handler: DomainEventSubscriberHandler;
}
