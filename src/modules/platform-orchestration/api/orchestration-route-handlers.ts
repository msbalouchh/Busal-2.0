import "server-only";

import { NextResponse } from "next/server";

import { ORCHESTRATION_MODULE_PERMISSIONS } from "@/modules/platform-orchestration/constants/permissions";
import {
  assertOrchestrationScope,
  resolveOrchestrationScope,
} from "@/modules/platform-orchestration/lib/orchestration-scope";
import { orchestrationObservabilityService } from "@/modules/platform-orchestration/services/observability.service";
import { orchestrationService } from "@/modules/platform-orchestration/services/orchestration.service";
import {
  listEventsQuerySchema,
  orchestrationMetricsQuerySchema,
  processQueueSchema,
  publishDomainEventSchema,
} from "@/modules/platform-orchestration/validation/orchestration-schemas";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";

function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export async function handleOrchestrationOverview(request: Request) {
  try {
    await protectedRoute({ permission: ORCHESTRATION_MODULE_PERMISSIONS.ORCHESTRATION_READ });
    const url = new URL(request.url);
    const parsed = listEventsQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

    return jsonSuccess({
      registry: orchestrationService.getRegistry(),
      knownEventTypes: parsed,
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handlePublishDomainEvent(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ORCHESTRATION_MODULE_PERMISSIONS.ORCHESTRATION_PUBLISH });
    const scope = resolveOrchestrationScope(platform);
    const body = publishDomainEventSchema.parse(await request.json());

    const result = await orchestrationService.publish({
      ...assertOrchestrationScope(scope),
      eventType: body.eventType,
      aggregateId: body.aggregateId,
      payload: body.payload,
      idempotencyKey: body.idempotencyKey,
      correlationId: body.correlationId,
      causationId: body.causationId,
      metadata: body.metadata,
    });

    return jsonSuccess(result, result.duplicate ? 200 : 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleProcessQueue(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ORCHESTRATION_MODULE_PERMISSIONS.ORCHESTRATION_QUEUE });
    const scope = resolveOrchestrationScope(platform);
    const body = processQueueSchema.parse(
      request.method === "GET"
        ? Object.fromEntries(new URL(request.url).searchParams.entries())
        : await request.json(),
    );

    const result = await orchestrationService.processQueue(scope.branchId, body.limit);
    return jsonSuccess(result);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleOrchestrationMetrics(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ORCHESTRATION_MODULE_PERMISSIONS.ORCHESTRATION_READ });
    const scope = resolveOrchestrationScope(platform);
    const url = new URL(request.url);
    orchestrationMetricsQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const [metrics, observability] = await Promise.all([
      orchestrationService.getMetrics(scope.branchId),
      orchestrationObservabilityService.getSnapshot(scope.branchId),
    ]);

    return jsonSuccess({ metrics, observability });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleListOrchestrationEvents(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ORCHESTRATION_MODULE_PERMISSIONS.ORCHESTRATION_READ });
    const scope = resolveOrchestrationScope(platform);
    const url = new URL(request.url);
    const parsed = listEventsQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const events = await orchestrationService.listRecentEvents(
      scope.businessId,
      parsed.limit,
      parsed.eventType,
    );

    return jsonSuccess({ events });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
