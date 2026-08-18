import "server-only";

import { createHash, randomBytes } from "node:crypto";

import {
  DEFAULT_WEBHOOK_RETRY_POLICY,
  generateWebhookSignature,
  resolveNextRetry,
} from "@/modules/api-gateway/engine/webhook-engine";
import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import {
  appendWebhookDeliveryLog,
  listDueWebhookRetries,
  updateWebhookDeliveryLogEntry,
  type StoredWebhookDelivery,
} from "@/modules/platform/lib/webhook-delivery-log";
import { loadPlatformConsumptionConfig } from "@/modules/platform/lib/platform-settings";
import { resolvePlatformEntitlements } from "@/modules/platform/services/platform-entitlements.service";
import type { DomainEventEnvelope } from "@/modules/platform-orchestration/types/domain-event.types";
import { decryptDeveloperSecret } from "@/services/developer-platform-context.service";
import { prisma } from "@/lib/prisma";

export const PLATFORM_WEBHOOK_EVENTS = [
  DOMAIN_EVENT_TYPES.ORDER_CREATED,
  DOMAIN_EVENT_TYPES.ORDER_UPDATED,
  DOMAIN_EVENT_TYPES.ORDER_COMPLETED,
  DOMAIN_EVENT_TYPES.CUSTOMER_CREATED,
  DOMAIN_EVENT_TYPES.CUSTOMER_UPDATED,
  DOMAIN_EVENT_TYPES.RESERVATION_CREATED,
  DOMAIN_EVENT_TYPES.RESERVATION_CANCELLED,
  DOMAIN_EVENT_TYPES.PAYMENT_COMPLETED,
  DOMAIN_EVENT_TYPES.PAYMENT_FAILED,
  DOMAIN_EVENT_TYPES.SUBSCRIPTION_CREATED,
  DOMAIN_EVENT_TYPES.SUBSCRIPTION_UPDATED,
  DOMAIN_EVENT_TYPES.BUSINESS_UPDATED,
] as const;

export type PlatformWebhookEvent = (typeof PLATFORM_WEBHOOK_EVENTS)[number];

export interface WebhookDeliveryPayload {
  id: string;
  event: string;
  createdAt: string;
  businessId: string;
  data: Record<string, unknown>;
}

export interface WebhookDeliveryResult {
  subscriptionId: string;
  endpoint: string;
  success: boolean;
  statusCode: number | null;
  attemptCount: number;
  nextRetryAt: Date | null;
  errorMessage: string | null;
  deliveryId: string;
}

function resolveWebhookSecret(storedSecret: string): string {
  try {
    return decryptDeveloperSecret(storedSecret);
  } catch {
    return storedSecret;
  }
}

async function assertWebhooksEnabled(businessId: string): Promise<void> {
  const [config, tenant] = await Promise.all([
    loadPlatformConsumptionConfig(businessId),
    prisma.tenantRecord.findUnique({
      where: { businessId },
      select: { subscriptionPlan: true },
    }),
  ]);

  if (!resolvePlatformEntitlements(tenant?.subscriptionPlan).webhooks) {
    throw new Error("Current subscription plan does not include webhook access.");
  }

  if (!config.webhooks.enabled) {
    throw new Error("Webhooks are not enabled for this tenant.");
  }
}

async function deliverToSubscription(input: {
  businessId: string;
  subscriptionId: string;
  endpoint: string;
  secret: string;
  event: string;
  payload: WebhookDeliveryPayload;
  attemptCount?: number;
  existingLogId?: string;
}): Promise<WebhookDeliveryResult> {
  const body = JSON.stringify(input.payload);
  const signature = generateWebhookSignature(body, input.secret);
  const attemptCount = input.attemptCount ?? 1;
  let success = false;
  let statusCode: number | null = null;
  let errorMessage: string | null = null;

  try {
    const response = await fetch(input.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Busal-Signature": signature,
        "X-Busal-Event": input.event,
        "X-Busal-Delivery-Id": input.payload.id,
        "User-Agent": "Busal-Webhook/1.0",
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });

    statusCode = response.status;
    success = response.ok;
    if (!success) {
      errorMessage = `HTTP ${response.status}`;
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Delivery failed";
  }

  const nextRetryAt = success
    ? null
    : resolveNextRetry(attemptCount, DEFAULT_WEBHOOK_RETRY_POLICY);

  const result: WebhookDeliveryResult = {
    subscriptionId: input.subscriptionId,
    endpoint: input.endpoint,
    success,
    statusCode,
    attemptCount,
    nextRetryAt,
    errorMessage,
    deliveryId: input.payload.id,
  };

  const logEntry = {
    id: input.existingLogId ?? crypto.randomUUID(),
    subscriptionId: input.subscriptionId,
    event: input.event,
    endpoint: input.endpoint,
    status: (success
      ? "delivered"
      : attemptCount >= DEFAULT_WEBHOOK_RETRY_POLICY.maxAttempts
        ? "failed"
        : "retrying") as StoredWebhookDelivery["status"],
    statusCode,
    attemptCount,
    errorMessage,
    deliveryId: input.payload.id,
    createdAt: new Date().toISOString(),
    nextRetryAt: nextRetryAt?.toISOString() ?? null,
    payloadData: input.payload.data,
  };

  if (input.existingLogId) {
    await updateWebhookDeliveryLogEntry(input.businessId, input.existingLogId, logEntry);
  } else {
    await appendWebhookDeliveryLog(input.businessId, logEntry);
  }

  return result;
}

export async function deliverWebhookEvent(input: {
  businessId: string;
  event: string;
  data: Record<string, unknown>;
}): Promise<WebhookDeliveryResult[]> {
  const [config, tenant] = await Promise.all([
    loadPlatformConsumptionConfig(input.businessId),
    prisma.tenantRecord.findUnique({
      where: { businessId: input.businessId },
      select: { subscriptionPlan: true },
    }),
  ]);

  if (!resolvePlatformEntitlements(tenant?.subscriptionPlan).webhooks) {
    return [];
  }

  if (!config.webhooks.enabled) {
    return [];
  }

  const subscriptions = await prisma.platformApiWebhookSubscription.findMany({
    where: {
      businessId: input.businessId,
      event: input.event,
      status: "ACTIVE",
    },
  });

  if (subscriptions.length === 0) {
    return [];
  }

  const payload: WebhookDeliveryPayload = {
    id: crypto.randomUUID(),
    event: input.event,
    createdAt: new Date().toISOString(),
    businessId: input.businessId,
    data: input.data,
  };

  const results: WebhookDeliveryResult[] = [];

  for (const subscription of subscriptions) {
    const secret = resolveWebhookSecret(subscription.secret);
    results.push(
      await deliverToSubscription({
        businessId: input.businessId,
        subscriptionId: subscription.id,
        endpoint: subscription.endpoint,
        secret,
        event: input.event,
        payload,
      }),
    );
  }

  return results;
}

export async function replayWebhookDelivery(
  businessId: string,
  deliveryId: string,
): Promise<WebhookDeliveryResult | null> {
  await assertWebhooksEnabled(businessId);

  const delivery = await import("@/modules/platform/lib/webhook-delivery-log").then((mod) =>
    mod.getWebhookDeliveryById(businessId, deliveryId),
  );

  if (!delivery) {
    return null;
  }

  const subscription = await prisma.platformApiWebhookSubscription.findFirst({
    where: { id: delivery.subscriptionId, businessId, status: "ACTIVE" },
  });

  if (!subscription) {
    return null;
  }

  const payload: WebhookDeliveryPayload = {
    id: crypto.randomUUID(),
    event: delivery.event,
    createdAt: new Date().toISOString(),
    businessId,
    data: { replayOf: delivery.deliveryId },
  };

  return deliverToSubscription({
    businessId,
    subscriptionId: subscription.id,
    endpoint: subscription.endpoint,
    secret: resolveWebhookSecret(subscription.secret),
    event: delivery.event,
    payload,
    attemptCount: 1,
  });
}

export async function publishPlatformDomainEvent(input: {
  businessId: string;
  event: string;
  data: Record<string, unknown>;
}): Promise<void> {
  await deliverWebhookEvent(input);
}

export async function bridgePlatformWebhooks(
  event: DomainEventEnvelope,
): Promise<Record<string, unknown>> {
  const deliveries = await deliverWebhookEvent({
    businessId: event.businessId,
    event: event.eventType,
    data: {
      ...event.payload,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt,
    },
  });

  return { deliveries: deliveries.length, success: deliveries.filter((d) => d.success).length };
}

export function verifyIncomingWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = generateWebhookSignature(payload, secret);
  return expected === signature;
}

export async function processWebhookRetries(limit = 50): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const due = await listDueWebhookRetries(limit);
  let succeeded = 0;
  let failed = 0;

  for (const { businessId, entry } of due) {
    try {
      await assertWebhooksEnabled(businessId);
    } catch {
      await updateWebhookDeliveryLogEntry(businessId, entry.id, {
        status: "failed",
        errorMessage: "Webhook access is not enabled for this tenant.",
        nextRetryAt: null,
      });
      failed += 1;
      continue;
    }

    const subscription = await prisma.platformApiWebhookSubscription.findFirst({
      where: { id: entry.subscriptionId, businessId, status: "ACTIVE" },
    });

    if (!subscription) {
      await updateWebhookDeliveryLogEntry(businessId, entry.id, {
        status: "failed",
        errorMessage: "Webhook subscription is no longer active.",
        nextRetryAt: null,
      });
      failed += 1;
      continue;
    }

    const payload: WebhookDeliveryPayload = {
      id: crypto.randomUUID(),
      event: entry.event,
      createdAt: new Date().toISOString(),
      businessId,
      data: entry.payloadData ?? { retryOf: entry.deliveryId },
    };

    const result = await deliverToSubscription({
      businessId,
      subscriptionId: subscription.id,
      endpoint: subscription.endpoint,
      secret: resolveWebhookSecret(subscription.secret),
      event: entry.event,
      payload,
      attemptCount: entry.attemptCount + 1,
      existingLogId: entry.id,
    });

    if (result.success) {
      succeeded += 1;
    } else {
      failed += 1;
    }
  }

  return { processed: due.length, succeeded, failed };
}
