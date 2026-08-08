import type { AutomationEventCategory } from "@prisma/client";

import {
  DOMAIN_EVENT_TYPES,
  type DomainEventModule,
} from "@/modules/platform-orchestration/constants/domain-events";

export interface DomainEventDefinition {
  eventType: string;
  aggregateType: string;
  category: AutomationEventCategory;
  sourceModule: DomainEventModule;
  description: string;
  version: number;
}

const registry = new Map<string, DomainEventDefinition>();

const EVENT_DEFINITIONS: DomainEventDefinition[] = [
  { eventType: DOMAIN_EVENT_TYPES.BUSINESS_CREATED, aggregateType: "business", category: "BUSINESS", sourceModule: "business", description: "Business created", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.BUSINESS_UPDATED, aggregateType: "business", category: "BUSINESS", sourceModule: "business", description: "Business updated", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.WORKSPACE_CREATED, aggregateType: "workspace", category: "BUSINESS", sourceModule: "workspace", description: "Workspace created", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.AUTH_LOGIN, aggregateType: "session", category: "SYSTEM", sourceModule: "auth", description: "User authenticated", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.CUSTOMER_CREATED, aggregateType: "customer", category: "CUSTOMER", sourceModule: "crm", description: "Customer created", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.CUSTOMER_UPDATED, aggregateType: "customer", category: "CUSTOMER", sourceModule: "crm", description: "Customer updated", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.RESERVATION_CREATED, aggregateType: "reservation", category: "RESERVATION", sourceModule: "reservation", description: "Reservation created", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.RESERVATION_UPDATED, aggregateType: "reservation", category: "RESERVATION", sourceModule: "reservation", description: "Reservation updated", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.RESERVATION_CANCELLED, aggregateType: "reservation", category: "RESERVATION", sourceModule: "reservation", description: "Reservation cancelled", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.TABLE_ASSIGNED, aggregateType: "table", category: "RESERVATION", sourceModule: "table", description: "Table assigned", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.TABLE_UPDATED, aggregateType: "table", category: "RESERVATION", sourceModule: "table", description: "Table updated", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.ORDER_CREATED, aggregateType: "order", category: "ORDER", sourceModule: "order", description: "Order created", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.ORDER_UPDATED, aggregateType: "order", category: "ORDER", sourceModule: "order", description: "Order updated", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.ORDER_COMPLETED, aggregateType: "order", category: "ORDER", sourceModule: "order", description: "Order completed", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.ORDER_CANCELLED, aggregateType: "order", category: "ORDER", sourceModule: "order", description: "Order cancelled", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.PAYMENT_COMPLETED, aggregateType: "payment", category: "REVENUE", sourceModule: "finance", description: "Payment completed", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.PAYMENT_FAILED, aggregateType: "payment", category: "REVENUE", sourceModule: "finance", description: "Payment failed", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.PAYMENT_REFUNDED, aggregateType: "payment", category: "REVENUE", sourceModule: "finance", description: "Payment refunded", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.KITCHEN_TICKET_CREATED, aggregateType: "kitchen_ticket", category: "ORDER", sourceModule: "kitchen", description: "Kitchen ticket created", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.KITCHEN_TICKET_COMPLETED, aggregateType: "kitchen_ticket", category: "ORDER", sourceModule: "kitchen", description: "Kitchen ticket completed", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.POS_TICKET_OPENED, aggregateType: "pos_ticket", category: "POS", sourceModule: "pos", description: "POS ticket opened", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.POS_SALE_COMPLETED, aggregateType: "pos_sale", category: "POS", sourceModule: "pos", description: "POS sale completed", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.INVENTORY_LOW_STOCK, aggregateType: "inventory_item", category: "INVENTORY", sourceModule: "inventory", description: "Inventory low stock", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.INVENTORY_UPDATED, aggregateType: "inventory_item", category: "INVENTORY", sourceModule: "inventory", description: "Inventory updated", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.INVENTORY_RECEIVED, aggregateType: "inventory_item", category: "INVENTORY", sourceModule: "inventory", description: "Inventory received", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.INVENTORY_WASTE_RECORDED, aggregateType: "inventory_item", category: "INVENTORY", sourceModule: "inventory", description: "Inventory waste recorded", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.INVENTORY_DEDUCTED, aggregateType: "inventory_item", category: "INVENTORY", sourceModule: "inventory", description: "Inventory deducted", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.FINANCE_JOURNAL_CREATED, aggregateType: "journal_entry", category: "REVENUE", sourceModule: "finance", description: "Finance journal created", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.BILLING_REVENUE_RECORDED, aggregateType: "revenue", category: "COMMERCIAL", sourceModule: "billing", description: "Billing revenue recorded", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.STAFF_CLOCKED_IN, aggregateType: "staff", category: "STAFF", sourceModule: "staff", description: "Staff clocked in", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.STAFF_CLOCKED_OUT, aggregateType: "staff", category: "STAFF", sourceModule: "staff", description: "Staff clocked out", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.STAFF_CREATED, aggregateType: "staff", category: "STAFF", sourceModule: "staff", description: "Staff created", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.STAFF_UPDATED, aggregateType: "staff", category: "STAFF", sourceModule: "staff", description: "Staff updated", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.STAFF_LEAVE_REQUESTED, aggregateType: "staff", category: "STAFF", sourceModule: "staff", description: "Staff leave requested", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.CUSTOMER_LOYALTY_UPDATED, aggregateType: "customer", category: "CUSTOMER", sourceModule: "crm", description: "Customer loyalty updated", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.SUBSCRIPTION_CREATED, aggregateType: "subscription", category: "COMMERCIAL", sourceModule: "billing", description: "Subscription created", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.SUBSCRIPTION_UPDATED, aggregateType: "subscription", category: "COMMERCIAL", sourceModule: "billing", description: "Subscription updated", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.SUBSCRIPTION_CANCELLED, aggregateType: "subscription", category: "COMMERCIAL", sourceModule: "billing", description: "Subscription cancelled", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.INVOICE_CREATED, aggregateType: "invoice", category: "COMMERCIAL", sourceModule: "billing", description: "Invoice created", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.NOTIFICATION_FAILED, aggregateType: "notification", category: "SYSTEM", sourceModule: "notification", description: "Notification failed", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.MENU_ITEM_CREATED, aggregateType: "menu_item", category: "BUSINESS", sourceModule: "menu", description: "Menu item created", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.MENU_ITEM_UPDATED, aggregateType: "menu_item", category: "BUSINESS", sourceModule: "menu", description: "Menu item updated", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.ANALYTICS_KPI_UPDATED, aggregateType: "kpi", category: "SYSTEM", sourceModule: "analytics", description: "Analytics KPI updated", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.NOTIFICATION_SENT, aggregateType: "notification", category: "SYSTEM", sourceModule: "notification", description: "Notification sent", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.INTEGRATION_WEBHOOK_DISPATCHED, aggregateType: "webhook", category: "SYSTEM", sourceModule: "integration", description: "Integration webhook dispatched", version: 1 },
  { eventType: DOMAIN_EVENT_TYPES.AI_CONTEXT_UPDATED, aggregateType: "ai_context", category: "AI", sourceModule: "ai", description: "AI context updated", version: 1 },
];

export function registerDomainEventDefinition(definition: DomainEventDefinition): void {
  registry.set(definition.eventType, definition);
}

export function getDomainEventDefinition(eventType: string): DomainEventDefinition | undefined {
  return registry.get(eventType);
}

export function listDomainEventDefinitions(): DomainEventDefinition[] {
  return Array.from(registry.values());
}

export function bootstrapDomainEventRegistry(): void {
  if (registry.size > 0) {
    return;
  }

  for (const definition of EVENT_DEFINITIONS) {
    registerDomainEventDefinition(definition);
  }
}

export function eventMatchesPattern(eventType: string, pattern: string): boolean {
  if (pattern === "*") {
    return true;
  }

  if (pattern.endsWith(".*")) {
    const prefix = pattern.slice(0, -2);
    return eventType.startsWith(`${prefix}.`);
  }

  return eventType === pattern;
}
