import "server-only";

import {
  getAutomationEvent,
  registerAutomationEvent,
} from "@/modules/ai-automation/registry/automation-registry";
import { ensureBootstrapAutomationPlugins } from "@/modules/ai-automation/plugins/bootstrap-automation";
import { processAutomationEvent } from "@/services/ai-automation.service";

/** Runs published automation workflows for a persisted domain event. */
export async function runAutomationEngineForEvent(
  eventId: string,
  businessId: string,
  eventType: string,
): Promise<void> {
  ensureBootstrapAutomationPlugins();
  registerAutomationEventIfMissing(eventType);
  await processAutomationEvent(eventId, businessId);
}

function registerAutomationEventIfMissing(eventType: string): void {
  if (getAutomationEvent(eventType)) {
    return;
  }

  registerAutomationEvent({
    eventType,
    category: "SYSTEM",
    description: `${eventType} orchestration event`,
    sourceModule: "platform-orchestration",
  });
}
