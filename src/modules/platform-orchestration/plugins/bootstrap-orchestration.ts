import "server-only";

import {
  getAutomationEvent,
  registerAutomationEvent,
} from "@/modules/ai-automation/registry/automation-registry";
import { ensureBootstrapAutomationPlugins } from "@/modules/ai-automation/plugins/bootstrap-automation";
import {
  bootstrapDomainEventRegistry,
  listDomainEventDefinitions,
} from "@/modules/platform-orchestration/registry/event-registry";
import { ensureOrchestrationSubscribersRegistered } from "@/modules/platform-orchestration/subscribers/register-subscribers";

let bootstrapComplete = false;

/** Registers domain events in both orchestration and ai-automation registries. */
export function registerOrchestrationAutomationEvents(): void {
  ensureBootstrapAutomationPlugins();
  bootstrapDomainEventRegistry();

  for (const definition of listDomainEventDefinitions()) {
    registerAutomationEventIfMissing(
      definition.eventType,
      definition.category,
      definition.sourceModule,
      definition.description,
    );
  }
}

function registerAutomationEventIfMissing(
  eventType: string,
  category: Parameters<typeof registerAutomationEvent>[0]["category"],
  sourceModule: string,
  description: string,
): void {
  if (getAutomationEvent(eventType)) {
    return;
  }

  registerAutomationEvent({
    eventType,
    category,
    description,
    sourceModule,
  });
}

export function ensureOrchestrationBootstrap(): void {
  if (bootstrapComplete) {
    return;
  }

  bootstrapDomainEventRegistry();
  registerOrchestrationAutomationEvents();
  ensureOrchestrationSubscribersRegistered();
  bootstrapComplete = true;
}
