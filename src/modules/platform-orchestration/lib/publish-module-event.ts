import "server-only";

import {
  buildDomainEventInput,
  publishDomainEvent,
} from "@/modules/platform-orchestration/publishers/domain-event-publisher";

export interface ModuleEventScope {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string | null;
  userId: string;
}

export interface PublishModuleEventOptions {
  eventType: string;
  aggregateId: string;
  payload?: Record<string, unknown>;
  idempotencyKey?: string;
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, unknown>;
}

function resolveBranchId(scope: ModuleEventScope): string {
  return scope.branchId ?? scope.businessId;
}

/** Publishes a domain event from a module service without coupling to other modules. */
export async function publishModuleDomainEvent(
  scope: ModuleEventScope,
  options: PublishModuleEventOptions,
): Promise<void> {
  const branchId = resolveBranchId(scope);

  await publishDomainEvent(
    buildDomainEventInput({
      eventType: options.eventType,
      aggregateId: options.aggregateId,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      businessId: scope.businessId,
      branchId,
      userId: scope.userId,
      payload: options.payload ?? {},
      idempotencyKey: options.idempotencyKey ?? `${options.eventType}:${options.aggregateId}`,
      correlationId: options.correlationId,
      causationId: options.causationId,
      metadata: options.metadata,
    }),
  );
}

export function moduleScopeFromPlatform(context: {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId?: string | null;
  userId?: string;
}): ModuleEventScope {
  return {
    tenantId: context.tenantId ?? context.businessId,
    workspaceId: context.workspaceId ?? context.businessId,
    businessId: context.businessId,
    branchId: context.branchId ?? null,
    userId: context.userId ?? "system",
  };
}
