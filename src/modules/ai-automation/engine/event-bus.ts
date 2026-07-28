import type { AutomationEventCategory, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getAutomationEvent } from "@/modules/ai-automation/registry/automation-registry";

export interface PublishEventInput {
  businessId: string;
  branchId?: string | null;
  category: AutomationEventCategory;
  eventType: string;
  payload: Record<string, unknown>;
  sourceModule: string;
}

export async function persistAutomationEvent(input: PublishEventInput) {
  const definition = getAutomationEvent(input.eventType);
  if (!definition) {
    throw new Error(`Unregistered automation event: ${input.eventType}`);
  }

  return prisma.automationEvent.create({
    data: {
      businessId: input.businessId,
      branchId: input.branchId ?? null,
      category: input.category,
      eventType: input.eventType,
      payload: input.payload as Prisma.InputJsonValue,
      sourceModule: input.sourceModule,
    },
  });
}
