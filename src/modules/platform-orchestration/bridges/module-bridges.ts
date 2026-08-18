import "server-only";

import { prisma } from "@/lib/prisma";
import { deductStockForCompletedOrder } from "@/services/inventory-stock.service";
import { processCrmForCompletedOrder } from "@/services/crm.service";
import { dispatchWebhookEvent } from "@/services/api-webhook-subscription-manager.service";
import { processAutomationEvent } from "@/services/ai-automation.service";
import { notificationService } from "@/modules/notifications/services/notification.service";
import { toNotificationPlatformContext } from "@/modules/notifications/lib/notification-scope";
import { NOTIFICATION_CHANNELS } from "@/modules/notifications/constants/notification-status";
import { financeService } from "@/modules/finance/services/finance.service";
import {
  toFinancePlatformContext,
  type FinanceTenantScope,
} from "@/modules/finance/lib/finance-scope";
import type { DomainEventEnvelope } from "@/modules/platform-orchestration/types/domain-event.types";

function scopeContext(event: DomainEventEnvelope) {
  return {
    tenantId: event.tenantId,
    workspaceId: event.workspaceId,
    businessId: event.businessId,
    branchId: event.branchId,
    userId: event.userId,
  };
}

function toFinanceScope(event: DomainEventEnvelope): FinanceTenantScope {
  const now = new Date();
  return {
    ...scopeContext(event),
    baseCurrency: "GBP",
    currentPeriodId: `period-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  };
}

export async function bridgeKitchenOnOrderCreated(event: DomainEventEnvelope): Promise<Record<string, unknown>> {
  const orderId = String(event.payload.orderId ?? event.aggregateId);

  const restaurantOrder = await prisma.restaurantOrder.findFirst({
    where: { id: orderId, businessId: event.businessId },
    select: { id: true, status: true },
  });

  if (!restaurantOrder) {
    return { kitchenEnqueued: false, orderId, source: "none" };
  }

  if (restaurantOrder.status === "PENDING") {
    await prisma.restaurantOrder.update({
      where: { id: orderId },
      data: { status: "PREPARING" },
    });
  }

  return { kitchenEnqueued: true, orderId, source: "oms" };
}

export async function bridgeInventoryOnPaymentCompleted(event: DomainEventEnvelope): Promise<Record<string, unknown>> {
  const orderId = String(event.payload.orderId ?? event.aggregateId);
  const staffId = String(event.payload.staffId ?? event.userId);
  const paymentId = event.payload.paymentId ? String(event.payload.paymentId) : null;

  await deductStockForCompletedOrder(event.businessId, orderId, staffId, paymentId);
  return { inventoryDeducted: true, orderId };
}

export async function bridgeCrmOnPaymentCompleted(event: DomainEventEnvelope): Promise<Record<string, unknown>> {
  const orderId = String(event.payload.orderId ?? event.aggregateId);
  const staffId = String(event.payload.staffId ?? event.userId);
  const paymentId = event.payload.paymentId ? String(event.payload.paymentId) : null;

  await processCrmForCompletedOrder(event.businessId, orderId, staffId, paymentId);
  return { crmUpdated: true, orderId };
}

export async function bridgeNotification(event: DomainEventEnvelope): Promise<Record<string, unknown>> {
  const context = toNotificationPlatformContext(scopeContext(event));
  const title = String(event.payload.title ?? `${event.eventType} notification`);
  const body = String(event.payload.body ?? `Event ${event.eventType} for ${event.aggregateId}`);

  const notification = await notificationService.sendNotification(context, {
    title,
    body,
    channel: NOTIFICATION_CHANNELS.IN_APP,
    recipientId: String(event.payload.recipientId ?? event.userId),
  });

  return { notificationId: notification.id };
}

export async function bridgeFinanceOnPaymentCompleted(event: DomainEventEnvelope): Promise<Record<string, unknown>> {
  const context = toFinancePlatformContext(toFinanceScope(event));
  const amount = Number(event.payload.amount ?? event.payload.total ?? 0);
  if (amount <= 0) {
    return { skipped: true, reason: "No amount in payload" };
  }

  const amountCents = Math.round(amount * 100);
  const entry = await financeService.createJournalEntry(context, {
    branchId: event.branchId,
    description: `Payment for order ${event.payload.orderId ?? event.aggregateId}`,
    referenceType: "payment",
    referenceId: String(event.payload.paymentId ?? event.aggregateId),
    lines: [
      { accountId: "acct-cash", debitCents: amountCents, creditCents: 0, description: "Payment received" },
      { accountId: "acct-revenue", debitCents: 0, creditCents: amountCents, description: "Revenue recognized" },
    ],
  });

  return { journalEntryId: entry.id };
}

export async function bridgeWebhooks(event: DomainEventEnvelope): Promise<Record<string, unknown>> {
  const { bridgePlatformWebhooks } = await import(
    "@/modules/platform/services/platform-webhook-delivery.service"
  );
  return bridgePlatformWebhooks(event);
}

export async function bridgeAutomationWorkflow(event: DomainEventEnvelope, eventId: string): Promise<Record<string, unknown>> {
  await processAutomationEvent(eventId, event.businessId);
  return { workflowProcessed: true };
}

export async function bridgeAiContextUpdate(event: DomainEventEnvelope): Promise<Record<string, unknown>> {
  const { aiEngine } = await import("@/modules/ai-engine/engine/ai-engine");
  return aiEngine.handleDomainEvent(event);
}

export async function bridgeAnalyticsKpi(event: DomainEventEnvelope): Promise<Record<string, unknown>> {
  return {
    kpiKey: event.eventType,
    aggregateId: event.aggregateId,
    recordedAt: new Date().toISOString(),
  };
}

export async function bridgeBillingRevenue(event: DomainEventEnvelope): Promise<Record<string, unknown>> {
  const amount = Number(event.payload.amount ?? event.payload.total ?? 0);
  return {
    revenueRecorded: amount > 0,
    amount,
    orderId: event.payload.orderId ?? event.aggregateId,
  };
}

export async function bridgePosTicketOpened(event: DomainEventEnvelope): Promise<Record<string, unknown>> {
  return {
    posTicketId: event.aggregateId,
    orderId: event.payload.orderId ?? event.aggregateId,
    opened: true,
  };
}

export async function bridgeTableAssigned(event: DomainEventEnvelope): Promise<Record<string, unknown>> {
  return {
    tableId: event.payload.tableId ?? event.aggregateId,
    reservationId: event.payload.reservationId ?? null,
  };
}

export async function bridgeReservationCreated(event: DomainEventEnvelope): Promise<Record<string, unknown>> {
  return {
    reservationId: event.aggregateId,
    customerId: event.payload.customerId ?? null,
  };
}

export async function bridgeStaffClockedIn(event: DomainEventEnvelope): Promise<Record<string, unknown>> {
  return {
    staffId: event.payload.staffId ?? event.aggregateId,
    clockedInAt: event.occurredAt,
  };
}

export async function bridgeInventoryLowStock(event: DomainEventEnvelope): Promise<Record<string, unknown>> {
  return {
    itemId: event.payload.itemId ?? event.aggregateId,
    currentStock: event.payload.currentStock ?? null,
  };
}
