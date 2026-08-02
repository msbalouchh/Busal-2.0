import "server-only";

export const AUTOMATION_TRIGGER_LIBRARY = [
  { id: "order.created", label: "Order Created", event: "order.created", category: "Restaurant" },
  {
    id: "order.completed",
    label: "Order Completed",
    event: "order.completed",
    category: "Restaurant",
  },
  {
    id: "reservation.created",
    label: "Reservation Created",
    event: "reservation.created",
    category: "Restaurant",
  },
  {
    id: "payment.received",
    label: "Payment Received",
    event: "payment.received",
    category: "Finance",
  },
  { id: "inventory.low", label: "Inventory Low", event: "inventory.low", category: "Inventory" },
  {
    id: "customer.registered",
    label: "Customer Registered",
    event: "customer.registered",
    category: "CRM",
  },
  { id: "staff.added", label: "Staff Added", event: "staff.added", category: "Staff" },
  {
    id: "invoice.created",
    label: "Invoice Created",
    event: "invoice.created",
    category: "Finance",
  },
  {
    id: "webhook.received",
    label: "Webhook Received",
    event: "webhook.received",
    category: "Integration",
  },
  { id: "api.event", label: "API Event", event: "api.event", category: "Platform" },
  {
    id: "schedule.event",
    label: "Scheduled Event",
    event: "schedule.event",
    category: "Scheduler",
  },
  { id: "manual.event", label: "Manual Event", event: "manual.event", category: "Manual" },
] as const;

export type AutomationTriggerDefinition = (typeof AUTOMATION_TRIGGER_LIBRARY)[number];

export function listTriggerLibrary(): AutomationTriggerDefinition[] {
  return [...AUTOMATION_TRIGGER_LIBRARY];
}

export function resolveTriggerEvent(
  triggerEvent: string,
  payload: Record<string, unknown>,
): { matched: boolean; event: string } {
  const normalized = triggerEvent.toLowerCase();
  const payloadEvent = String(payload.event ?? payload.type ?? "").toLowerCase();
  return {
    matched: normalized === payloadEvent || payloadEvent === "",
    event: normalized,
  };
}

export function validateTriggerConfiguration(
  type: string,
  event: string,
): { valid: boolean; message: string } {
  if (!type.trim()) return { valid: false, message: "Trigger type is required" };
  if (!event.trim()) return { valid: false, message: "Trigger event is required" };
  const known = AUTOMATION_TRIGGER_LIBRARY.some((item) => item.event === event);
  if (!known) {
    return { valid: true, message: "Custom trigger event accepted" };
  }
  return { valid: true, message: "Trigger configuration valid" };
}
