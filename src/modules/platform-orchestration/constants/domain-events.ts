/** Source modules that may publish domain events. */
export const DOMAIN_EVENT_MODULES = {
  BUSINESS: "business",
  WORKSPACE: "workspace",
  AUTH: "auth",
  CRM: "crm",
  MENU: "menu",
  TABLE: "table",
  RESERVATION: "reservation",
  ORDER: "order",
  KITCHEN: "kitchen",
  POS: "pos",
  INVENTORY: "inventory",
  FINANCE: "finance",
  BILLING: "billing",
  STAFF: "staff",
  ANALYTICS: "analytics",
  NOTIFICATION: "notification",
  INTEGRATION: "integration",
  AI: "ai",
  SYSTEM: "system",
} as const;

export type DomainEventModule = (typeof DOMAIN_EVENT_MODULES)[keyof typeof DOMAIN_EVENT_MODULES];

/** Standard lifecycle actions for domain events. */
export const DOMAIN_EVENT_ACTIONS = {
  CREATED: "created",
  UPDATED: "updated",
  DELETED: "deleted",
  ASSIGNED: "assigned",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  PAID: "paid",
  REFUNDED: "refunded",
  FAILED: "failed",
  APPROVED: "approved",
  REJECTED: "rejected",
  ACTIVATED: "activated",
  DEACTIVATED: "deactivated",
} as const;

export type DomainEventAction = (typeof DOMAIN_EVENT_ACTIONS)[keyof typeof DOMAIN_EVENT_ACTIONS];

/** Registered platform domain event types (module.action). */
export const DOMAIN_EVENT_TYPES = {
  BUSINESS_CREATED: "business.created",
  BUSINESS_UPDATED: "business.updated",
  WORKSPACE_CREATED: "workspace.created",
  AUTH_LOGIN: "auth.login",
  CUSTOMER_CREATED: "customer.created",
  CUSTOMER_UPDATED: "customer.updated",
  RESERVATION_CREATED: "reservation.created",
  RESERVATION_UPDATED: "reservation.updated",
  RESERVATION_CANCELLED: "reservation.cancelled",
  TABLE_ASSIGNED: "table.assigned",
  TABLE_UPDATED: "table.updated",
  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  ORDER_COMPLETED: "order.completed",
  ORDER_CANCELLED: "order.cancelled",
  PAYMENT_COMPLETED: "payment.completed",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_REFUNDED: "payment.refunded",
  KITCHEN_TICKET_CREATED: "kitchen.ticket.created",
  KITCHEN_TICKET_COMPLETED: "kitchen.ticket.completed",
  POS_TICKET_OPENED: "pos.ticket.opened",
  POS_SALE_COMPLETED: "pos.sale.completed",
  INVENTORY_LOW_STOCK: "inventory.low_stock",
  INVENTORY_UPDATED: "inventory.updated",
  INVENTORY_RECEIVED: "inventory.received",
  INVENTORY_WASTE_RECORDED: "inventory.waste_recorded",
  INVENTORY_DEDUCTED: "inventory.deducted",
  STAFF_CREATED: "staff.created",
  STAFF_UPDATED: "staff.updated",
  STAFF_LEAVE_REQUESTED: "staff.leave_requested",
  CUSTOMER_LOYALTY_UPDATED: "customer.loyalty.updated",
  SUBSCRIPTION_CREATED: "subscription.created",
  SUBSCRIPTION_UPDATED: "subscription.updated",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",
  INVOICE_CREATED: "invoice.created",
  NOTIFICATION_FAILED: "notification.failed",
  MENU_ITEM_CREATED: "menu.item.created",
  MENU_ITEM_UPDATED: "menu.item.updated",
  FINANCE_JOURNAL_CREATED: "finance.journal.created",
  BILLING_REVENUE_RECORDED: "billing.revenue.recorded",
  STAFF_CLOCKED_IN: "staff.clocked_in",
  STAFF_CLOCKED_OUT: "staff.clocked_out",
  ANALYTICS_KPI_UPDATED: "analytics.kpi.updated",
  NOTIFICATION_SENT: "notification.sent",
  INTEGRATION_WEBHOOK_DISPATCHED: "integration.webhook.dispatched",
  AI_CONTEXT_UPDATED: "ai.context.updated",
  TENANT_CREATED: "tenant.created",
  PLAN_CHANGED: "plan.changed",
  FEATURE_ENABLED: "feature.enabled",
  FEATURE_DISABLED: "feature.disabled",
  BUSINESS_SUSPENDED: "business.suspended",
  BUSINESS_ACTIVATED: "business.activated",
} as const;

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[keyof typeof DOMAIN_EVENT_TYPES];

export const ORCHESTRATION_EVENT_VERSION = 1;

export const DEFAULT_MAX_JOB_ATTEMPTS = 5;

export const IDEMPOTENCY_KEY_TTL_MS = 24 * 60 * 60 * 1000;
