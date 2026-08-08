import "server-only";

import {
  DOMAIN_EVENT_TYPES,
  DOMAIN_EVENT_MODULES,
} from "@/modules/platform-orchestration/constants/domain-events";
import { registerDomainEventSubscriber } from "@/modules/platform-orchestration/registry/subscriber-registry";
import {
  bridgeAiContextUpdate,
  bridgeAnalyticsKpi,
  bridgeBillingRevenue,
  bridgeCrmOnPaymentCompleted,
  bridgeFinanceOnPaymentCompleted,
  bridgeInventoryLowStock,
  bridgeInventoryOnPaymentCompleted,
  bridgeKitchenOnOrderCreated,
  bridgeNotification,
  bridgePosTicketOpened,
  bridgeReservationCreated,
  bridgeStaffClockedIn,
  bridgeTableAssigned,
  bridgeWebhooks,
} from "@/modules/platform-orchestration/bridges/module-bridges";

let registered = false;

export function registerOrchestrationSubscribers(): void {
  if (registered) {
    return;
  }

  registerDomainEventSubscriber({
    subscriberId: "kitchen.order-created",
    eventPattern: DOMAIN_EVENT_TYPES.ORDER_CREATED,
    module: DOMAIN_EVENT_MODULES.KITCHEN,
    async: false,
    handler: bridgeKitchenOnOrderCreated,
  });

  registerDomainEventSubscriber({
    subscriberId: "pos.order-created",
    eventPattern: DOMAIN_EVENT_TYPES.ORDER_CREATED,
    module: DOMAIN_EVENT_MODULES.POS,
    async: false,
    handler: bridgePosTicketOpened,
  });

  registerDomainEventSubscriber({
    subscriberId: "finance.order-created",
    eventPattern: DOMAIN_EVENT_TYPES.ORDER_CREATED,
    module: DOMAIN_EVENT_MODULES.FINANCE,
    async: true,
    jobType: "analytics",
    handler: bridgeAnalyticsKpi,
  });

  registerDomainEventSubscriber({
    subscriberId: "billing.order-created",
    eventPattern: DOMAIN_EVENT_TYPES.ORDER_CREATED,
    module: DOMAIN_EVENT_MODULES.BILLING,
    async: true,
    jobType: "analytics",
    handler: bridgeBillingRevenue,
  });

  registerDomainEventSubscriber({
    subscriberId: "analytics.order-created",
    eventPattern: DOMAIN_EVENT_TYPES.ORDER_CREATED,
    module: DOMAIN_EVENT_MODULES.ANALYTICS,
    async: true,
    jobType: "analytics",
    handler: bridgeAnalyticsKpi,
  });

  registerDomainEventSubscriber({
    subscriberId: "crm.order-created",
    eventPattern: DOMAIN_EVENT_TYPES.ORDER_CREATED,
    module: DOMAIN_EVENT_MODULES.CRM,
    async: true,
    jobType: "analytics",
    handler: async (event) => ({ customerId: event.payload.customerId ?? null }),
  });

  registerDomainEventSubscriber({
    subscriberId: "notifications.order-created",
    eventPattern: DOMAIN_EVENT_TYPES.ORDER_CREATED,
    module: DOMAIN_EVENT_MODULES.NOTIFICATION,
    async: true,
    jobType: "notification",
    handler: bridgeNotification,
  });

  registerDomainEventSubscriber({
    subscriberId: "ai.order-created",
    eventPattern: DOMAIN_EVENT_TYPES.ORDER_CREATED,
    module: DOMAIN_EVENT_MODULES.AI,
    async: true,
    jobType: "ai",
    handler: bridgeAiContextUpdate,
  });

  registerDomainEventSubscriber({
    subscriberId: "integrations.order-created",
    eventPattern: DOMAIN_EVENT_TYPES.ORDER_CREATED,
    module: DOMAIN_EVENT_MODULES.INTEGRATION,
    async: true,
    jobType: "webhook",
    handler: bridgeWebhooks,
  });

  registerDomainEventSubscriber({
    subscriberId: "finance.payment-completed",
    eventPattern: DOMAIN_EVENT_TYPES.PAYMENT_COMPLETED,
    module: DOMAIN_EVENT_MODULES.FINANCE,
    async: false,
    handler: bridgeFinanceOnPaymentCompleted,
  });

  registerDomainEventSubscriber({
    subscriberId: "billing.payment-completed",
    eventPattern: DOMAIN_EVENT_TYPES.PAYMENT_COMPLETED,
    module: DOMAIN_EVENT_MODULES.BILLING,
    async: true,
    jobType: "analytics",
    handler: bridgeBillingRevenue,
  });

  registerDomainEventSubscriber({
    subscriberId: "analytics.payment-completed",
    eventPattern: DOMAIN_EVENT_TYPES.PAYMENT_COMPLETED,
    module: DOMAIN_EVENT_MODULES.ANALYTICS,
    async: true,
    jobType: "analytics",
    handler: bridgeAnalyticsKpi,
  });

  registerDomainEventSubscriber({
    subscriberId: "crm.payment-completed",
    eventPattern: DOMAIN_EVENT_TYPES.PAYMENT_COMPLETED,
    module: DOMAIN_EVENT_MODULES.CRM,
    async: false,
    handler: bridgeCrmOnPaymentCompleted,
  });

  registerDomainEventSubscriber({
    subscriberId: "inventory.payment-completed",
    eventPattern: DOMAIN_EVENT_TYPES.PAYMENT_COMPLETED,
    module: DOMAIN_EVENT_MODULES.INVENTORY,
    async: false,
    handler: bridgeInventoryOnPaymentCompleted,
  });

  registerDomainEventSubscriber({
    subscriberId: "notifications.payment-completed",
    eventPattern: DOMAIN_EVENT_TYPES.PAYMENT_COMPLETED,
    module: DOMAIN_EVENT_MODULES.NOTIFICATION,
    async: true,
    jobType: "notification",
    handler: bridgeNotification,
  });

  registerDomainEventSubscriber({
    subscriberId: "ai.payment-completed",
    eventPattern: DOMAIN_EVENT_TYPES.PAYMENT_COMPLETED,
    module: DOMAIN_EVENT_MODULES.AI,
    async: true,
    jobType: "ai",
    handler: bridgeAiContextUpdate,
  });

  registerDomainEventSubscriber({
    subscriberId: "integrations.payment-completed",
    eventPattern: DOMAIN_EVENT_TYPES.PAYMENT_COMPLETED,
    module: DOMAIN_EVENT_MODULES.INTEGRATION,
    async: true,
    jobType: "webhook",
    handler: bridgeWebhooks,
  });

  registerDomainEventSubscriber({
    subscriberId: "table.reservation-created",
    eventPattern: DOMAIN_EVENT_TYPES.RESERVATION_CREATED,
    module: DOMAIN_EVENT_MODULES.TABLE,
    async: false,
    handler: bridgeTableAssigned,
  });

  registerDomainEventSubscriber({
    subscriberId: "crm.reservation-created",
    eventPattern: DOMAIN_EVENT_TYPES.RESERVATION_CREATED,
    module: DOMAIN_EVENT_MODULES.CRM,
    async: true,
    jobType: "analytics",
    handler: bridgeReservationCreated,
  });

  registerDomainEventSubscriber({
    subscriberId: "notifications.reservation-created",
    eventPattern: DOMAIN_EVENT_TYPES.RESERVATION_CREATED,
    module: DOMAIN_EVENT_MODULES.NOTIFICATION,
    async: true,
    jobType: "notification",
    handler: bridgeNotification,
  });

  registerDomainEventSubscriber({
    subscriberId: "analytics.reservation-created",
    eventPattern: DOMAIN_EVENT_TYPES.RESERVATION_CREATED,
    module: DOMAIN_EVENT_MODULES.ANALYTICS,
    async: true,
    jobType: "analytics",
    handler: bridgeAnalyticsKpi,
  });

  registerDomainEventSubscriber({
    subscriberId: "ai.reservation-created",
    eventPattern: DOMAIN_EVENT_TYPES.RESERVATION_CREATED,
    module: DOMAIN_EVENT_MODULES.AI,
    async: true,
    jobType: "ai",
    handler: bridgeAiContextUpdate,
  });

  registerDomainEventSubscriber({
    subscriberId: "notifications.inventory-low-stock",
    eventPattern: DOMAIN_EVENT_TYPES.INVENTORY_LOW_STOCK,
    module: DOMAIN_EVENT_MODULES.NOTIFICATION,
    async: true,
    jobType: "notification",
    handler: bridgeNotification,
  });

  registerDomainEventSubscriber({
    subscriberId: "analytics.inventory-low-stock",
    eventPattern: DOMAIN_EVENT_TYPES.INVENTORY_LOW_STOCK,
    module: DOMAIN_EVENT_MODULES.ANALYTICS,
    async: true,
    jobType: "analytics",
    handler: bridgeInventoryLowStock,
  });

  registerDomainEventSubscriber({
    subscriberId: "ai.inventory-low-stock",
    eventPattern: DOMAIN_EVENT_TYPES.INVENTORY_LOW_STOCK,
    module: DOMAIN_EVENT_MODULES.AI,
    async: true,
    jobType: "ai",
    handler: bridgeAiContextUpdate,
  });

  registerDomainEventSubscriber({
    subscriberId: "analytics.staff-clocked-in",
    eventPattern: DOMAIN_EVENT_TYPES.STAFF_CLOCKED_IN,
    module: DOMAIN_EVENT_MODULES.ANALYTICS,
    async: true,
    jobType: "analytics",
    handler: bridgeStaffClockedIn,
  });

  registerDomainEventSubscriber({
    subscriberId: "ai.staff-clocked-in",
    eventPattern: DOMAIN_EVENT_TYPES.STAFF_CLOCKED_IN,
    module: DOMAIN_EVENT_MODULES.AI,
    async: true,
    jobType: "ai",
    handler: bridgeAiContextUpdate,
  });

  registerDomainEventSubscriber({
    subscriberId: "analytics.all-events",
    eventPattern: "*",
    module: DOMAIN_EVENT_MODULES.ANALYTICS,
    async: true,
    jobType: "analytics",
    handler: bridgeAnalyticsKpi,
  });

  registerDomainEventSubscriber({
    subscriberId: "ai.business-events",
    eventPattern: "*",
    module: DOMAIN_EVENT_MODULES.AI,
    async: true,
    jobType: "ai",
    handler: bridgeAiContextUpdate,
  });

  registerDomainEventSubscriber({
    subscriberId: "integrations.webhooks-orders",
    eventPattern: "order.*",
    module: DOMAIN_EVENT_MODULES.INTEGRATION,
    async: true,
    jobType: "webhook",
    handler: bridgeWebhooks,
  });

  registerDomainEventSubscriber({
    subscriberId: "integrations.webhooks-reservations",
    eventPattern: "reservation.*",
    module: DOMAIN_EVENT_MODULES.INTEGRATION,
    async: true,
    jobType: "webhook",
    handler: bridgeWebhooks,
  });

  registerDomainEventSubscriber({
    subscriberId: "integrations.webhooks-payments",
    eventPattern: "payment.*",
    module: DOMAIN_EVENT_MODULES.INTEGRATION,
    async: true,
    jobType: "webhook",
    handler: bridgeWebhooks,
  });

  registerDomainEventSubscriber({
    subscriberId: "integrations.webhooks-customers",
    eventPattern: "customer.*",
    module: DOMAIN_EVENT_MODULES.INTEGRATION,
    async: true,
    jobType: "webhook",
    handler: bridgeWebhooks,
  });

  registerDomainEventSubscriber({
    subscriberId: "integrations.webhooks-inventory",
    eventPattern: "inventory.*",
    module: DOMAIN_EVENT_MODULES.INTEGRATION,
    async: true,
    jobType: "webhook",
    handler: bridgeWebhooks,
  });

  registerDomainEventSubscriber({
    subscriberId: "integrations.webhooks-subscriptions",
    eventPattern: "subscription.*",
    module: DOMAIN_EVENT_MODULES.INTEGRATION,
    async: true,
    jobType: "webhook",
    handler: bridgeWebhooks,
  });

  registerDomainEventSubscriber({
    subscriberId: "inventory.order-created",
    eventPattern: DOMAIN_EVENT_TYPES.ORDER_CREATED,
    module: DOMAIN_EVENT_MODULES.INVENTORY,
    async: true,
    jobType: "analytics",
    handler: bridgeAnalyticsKpi,
  });

  registerDomainEventSubscriber({
    subscriberId: "notifications.inventory-updated",
    eventPattern: DOMAIN_EVENT_TYPES.INVENTORY_LOW_STOCK,
    module: DOMAIN_EVENT_MODULES.NOTIFICATION,
    async: true,
    jobType: "notification",
    handler: bridgeNotification,
  });

  registerDomainEventSubscriber({
    subscriberId: "crm.customer-created",
    eventPattern: DOMAIN_EVENT_TYPES.CUSTOMER_CREATED,
    module: DOMAIN_EVENT_MODULES.CRM,
    async: true,
    jobType: "analytics",
    handler: async (event) => ({ customerId: event.aggregateId }),
  });

  registerDomainEventSubscriber({
    subscriberId: "notifications.customer-created",
    eventPattern: DOMAIN_EVENT_TYPES.CUSTOMER_CREATED,
    module: DOMAIN_EVENT_MODULES.NOTIFICATION,
    async: true,
    jobType: "notification",
    handler: bridgeNotification,
  });

  registered = true;
}

export function ensureOrchestrationSubscribersRegistered(): void {
  registerOrchestrationSubscribers();
}
