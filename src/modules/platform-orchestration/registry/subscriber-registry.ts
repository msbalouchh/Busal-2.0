import type {
  DomainEventSubscriberHandler,
  DomainEventSubscriberRegistration,
} from "@/modules/platform-orchestration/types/domain-event.types";
import { eventMatchesPattern } from "@/modules/platform-orchestration/registry/event-registry";

const subscribers: DomainEventSubscriberRegistration[] = [];

export function registerDomainEventSubscriber(
  registration: DomainEventSubscriberRegistration,
): void {
  subscribers.push(registration);
}

export function getSubscribersForEvent(eventType: string): DomainEventSubscriberRegistration[] {
  return subscribers.filter((subscriber) => eventMatchesPattern(eventType, subscriber.eventPattern));
}

export function listDomainEventSubscribers(): DomainEventSubscriberRegistration[] {
  return [...subscribers];
}

export function clearDomainEventSubscribers(): void {
  subscribers.length = 0;
}

export type { DomainEventSubscriberHandler };
