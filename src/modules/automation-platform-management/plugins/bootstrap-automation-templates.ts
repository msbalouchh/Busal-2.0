import "server-only";

import type { PlatformAutomationTriggerType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createAutomationWorkflow } from "@/services/automation-workflow-manager.service";

export const AUTOMATION_WORKFLOW_TEMPLATES = [
  {
    slug: "order-confirmation-email",
    name: "Order Confirmation Email",
    description: "Send email when an order is completed",
    triggerType: "EVENT" as PlatformAutomationTriggerType,
    trigger: { type: "event", event: "order.completed" },
    conditions: [{ operator: "exists", field: "customer.email", value: "" }],
    actions: [{ type: "send.email", order: 1, configuration: { template: "order_confirmation" } }],
  },
  {
    slug: "low-inventory-alert",
    name: "Low Inventory Alert",
    description: "Notify staff when inventory is low",
    triggerType: "EVENT" as PlatformAutomationTriggerType,
    trigger: { type: "event", event: "inventory.low" },
    conditions: [{ operator: "lt", field: "quantity", value: "10" }],
    actions: [{ type: "notify.staff", order: 1, configuration: { channel: "in_app" } }],
  },
  {
    slug: "new-customer-welcome",
    name: "New Customer Welcome",
    description: "Welcome message for newly registered customers",
    triggerType: "EVENT" as PlatformAutomationTriggerType,
    trigger: { type: "event", event: "customer.registered" },
    conditions: [],
    actions: [
      { type: "send.email", order: 1, configuration: { template: "welcome" } },
      { type: "notify.customer", order: 2, configuration: { channel: "in_app" } },
    ],
  },
  {
    slug: "payment-received-report",
    name: "Payment Received Report",
    description: "Generate report when payment is received",
    triggerType: "EVENT" as PlatformAutomationTriggerType,
    trigger: { type: "event", event: "payment.received" },
    conditions: [],
    actions: [{ type: "generate.report", order: 1, configuration: { report: "payments_daily" } }],
  },
  {
    slug: "manual-staff-task",
    name: "Manual Staff Task",
    description: "Create a task from manual trigger",
    triggerType: "MANUAL" as PlatformAutomationTriggerType,
    trigger: { type: "manual", event: "manual.event" },
    conditions: [],
    actions: [{ type: "create.task", order: 1, configuration: { assignee: "staff" } }],
  },
] as const;

export function listAutomationTemplates() {
  return AUTOMATION_WORKFLOW_TEMPLATES.map((template) => ({
    id: template.slug,
    name: template.name,
    description: template.description,
    triggerType: template.triggerType,
    triggerEvent: template.trigger.event,
    actions: template.actions.map((action) => action.type),
  }));
}

export async function createWorkflowFromTemplate(ownerId: string, templateSlug: string) {
  const template = AUTOMATION_WORKFLOW_TEMPLATES.find((item) => item.slug === templateSlug);
  if (!template) throw new Error("Template not found");

  const workflow = await createAutomationWorkflow(ownerId, {
    name: template.name,
    description: template.description,
    triggerType: template.triggerType,
    configuration: { templateSlug: template.slug },
  });

  await prisma.automationPlatformTrigger.create({
    data: {
      workflowId: workflow.id,
      type: template.trigger.type,
      event: template.trigger.event,
    },
  });

  for (const condition of template.conditions) {
    await prisma.automationPlatformCondition.create({
      data: {
        workflowId: workflow.id,
        operator: condition.operator,
        field: condition.field,
        value: condition.value,
      },
    });
  }

  for (const action of template.actions) {
    await prisma.automationPlatformAction.create({
      data: {
        workflowId: workflow.id,
        type: action.type,
        order: action.order,
        configuration: action.configuration,
      },
    });
  }

  return workflow;
}

export async function ensureAutomationTemplatesAvailable(ownerId: string) {
  void ownerId;
  return listAutomationTemplates();
}
