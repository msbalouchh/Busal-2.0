import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  registerAutomationAction,
  registerAutomationEvent,
  registerAutomationTrigger,
} from "@/modules/ai-automation/registry/automation-registry";

const SYSTEM_EVENTS = [
  { eventType: "CustomerCreated", category: "CUSTOMER" as const, sourceModule: "crm" },
  { eventType: "OrderCompleted", category: "ORDER" as const, sourceModule: "order" },
  { eventType: "StockLow", category: "INVENTORY" as const, sourceModule: "inventory" },
  { eventType: "InvoiceOverdue", category: "REVENUE" as const, sourceModule: "revops" },
  { eventType: "ContractExpiring", category: "CONTRACT" as const, sourceModule: "contracts" },
  {
    eventType: "ProjectCompleted",
    category: "IMPLEMENTATION" as const,
    sourceModule: "implementation",
  },
  { eventType: "NewLeadCreated", category: "COMMERCIAL" as const, sourceModule: "sales-crm" },
  { eventType: "PaymentReceived", category: "REVENUE" as const, sourceModule: "revops" },
  { eventType: "StaffCreated", category: "STAFF" as const, sourceModule: "staff" },
  {
    eventType: "ReservationCreated",
    category: "RESERVATION" as const,
    sourceModule: "reservations",
  },
  { eventType: "PosTransactionCompleted", category: "POS" as const, sourceModule: "pos" },
  {
    eventType: "AutomationWorkflowCompleted",
    category: "AI" as const,
    sourceModule: "ai-automation",
  },
  { eventType: "SystemHealthCheck", category: "SYSTEM" as const, sourceModule: "system" },
] as const;

const TRIGGERS = [
  {
    triggerType: "SYSTEM_EVENT" as const,
    label: "System Event",
    description: "Triggered by bus events",
  },
  {
    triggerType: "SCHEDULED" as const,
    label: "Scheduled",
    description: "Cron or interval trigger",
  },
  { triggerType: "MANUAL" as const, label: "Manual", description: "Started by a user" },
  { triggerType: "WEBHOOK" as const, label: "Webhook", description: "External webhook trigger" },
  { triggerType: "API" as const, label: "API", description: "Programmatic API trigger" },
] as const;

const ACTIONS = [
  {
    actionType: "CREATE_RECORD" as const,
    label: "Create Record",
    permissions: [PERMISSION_CODES.AI_AUTOMATION_EXECUTE],
  },
  {
    actionType: "UPDATE_RECORD" as const,
    label: "Update Record",
    permissions: [PERMISSION_CODES.AI_AUTOMATION_EXECUTE],
  },
  {
    actionType: "DELETE_RECORD" as const,
    label: "Delete Record",
    permissions: [PERMISSION_CODES.AI_AUTOMATION_EXECUTE],
  },
  {
    actionType: "SEND_EMAIL" as const,
    label: "Send Email",
    permissions: [PERMISSION_CODES.AI_AUTOMATION_EXECUTE],
  },
  {
    actionType: "SEND_WHATSAPP" as const,
    label: "Send WhatsApp",
    permissions: [PERMISSION_CODES.AI_AUTOMATION_EXECUTE],
  },
  {
    actionType: "GENERATE_PROPOSAL" as const,
    label: "Generate Proposal",
    permissions: [PERMISSION_CODES.PROPOSALS_MANAGE],
  },
  {
    actionType: "GENERATE_INVOICE" as const,
    label: "Generate Invoice",
    permissions: [PERMISSION_CODES.INVOICES_MANAGE],
  },
  {
    actionType: "CREATE_TASK" as const,
    label: "Create Task",
    permissions: [PERMISSION_CODES.AI_AUTOMATION_EXECUTE],
  },
  {
    actionType: "NOTIFY_STAFF" as const,
    label: "Notify Staff",
    permissions: [PERMISSION_CODES.STAFF_VIEW],
  },
  {
    actionType: "CALL_AI_AGENT" as const,
    label: "Call AI Agent",
    permissions: [PERMISSION_CODES.AI_TOOL_EXECUTE],
  },
  {
    actionType: "RUN_WORKFLOW" as const,
    label: "Run Workflow",
    permissions: [PERMISSION_CODES.AI_AUTOMATION_EXECUTE],
  },
] as const;

export function registerBootstrapAutomationPlugins(): void {
  for (const event of SYSTEM_EVENTS) {
    registerAutomationEvent({
      eventType: event.eventType,
      category: event.category,
      description: `${event.eventType} event`,
      sourceModule: event.sourceModule,
    });
  }

  for (const trigger of TRIGGERS) {
    registerAutomationTrigger(trigger);
  }

  for (const action of ACTIONS) {
    registerAutomationAction({
      actionType: action.actionType,
      label: action.label,
      description: action.label,
      requiredPermissions: [...action.permissions],
    });
  }
}

let bootstrapComplete = false;

export function ensureBootstrapAutomationPlugins(): void {
  if (bootstrapComplete) {
    return;
  }

  registerBootstrapAutomationPlugins();
  bootstrapComplete = true;
}

export const DEFAULT_WORKFLOW_TEMPLATES = [
  {
    name: "Invoice Overdue Reminder",
    description: "Notify finance when an invoice becomes overdue.",
    eventType: "InvoiceOverdue",
    triggerType: "SYSTEM_EVENT" as const,
  },
  {
    name: "Low Stock Reorder",
    description: "Create a task when inventory drops below threshold.",
    eventType: "StockLow",
    triggerType: "SYSTEM_EVENT" as const,
  },
  {
    name: "New Lead Nurture",
    description: "AI decision and staff notification for new leads.",
    eventType: "NewLeadCreated",
    triggerType: "SYSTEM_EVENT" as const,
  },
] as const;
