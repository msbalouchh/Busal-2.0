import "server-only";

import {
  buildEnvelopeVersion,
  parseEventAction,
} from "@/modules/platform-orchestration/bus/event-dispatcher";
import { domainEventBus, type PublishDomainEventInput } from "@/modules/platform-orchestration/bus/domain-event-bus";
import {
  bootstrapDomainEventRegistry,
  getDomainEventDefinition,
} from "@/modules/platform-orchestration/registry/event-registry";
import { ensureOrchestrationBootstrap } from "@/modules/platform-orchestration/plugins/bootstrap-orchestration";
import type { DomainEventDispatchResult } from "@/modules/platform-orchestration/types/domain-event.types";

/** Public publisher API for modules to emit domain events without direct coupling. */
export async function publishDomainEvent(
  input: PublishDomainEventInput,
): Promise<DomainEventDispatchResult> {
  ensureOrchestrationBootstrap();
  bootstrapDomainEventRegistry();
  return domainEventBus.publish(input);
}

export function buildDomainEventInput(
  partial: Omit<PublishDomainEventInput, "eventType" | "aggregateId"> & {
    eventType: string;
    aggregateId: string;
  },
): PublishDomainEventInput {
  const definition = getDomainEventDefinition(partial.eventType);
  if (!definition) {
    throw new Error(`Cannot build event input for unregistered type: ${partial.eventType}`);
  }

  return {
    ...partial,
    payload: {
      ...partial.payload,
      action: parseEventAction(partial.eventType),
      version: buildEnvelopeVersion(partial.eventType),
    },
  };
}

export { type PublishDomainEventInput };
