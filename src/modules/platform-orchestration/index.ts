export { DOMAIN_EVENT_MODULES, DOMAIN_EVENT_ACTIONS, DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
export { ORCHESTRATION_MODULE_PERMISSIONS } from "@/modules/platform-orchestration/constants/permissions";

export type {
  DomainEventEnvelope,
  DomainEventDispatchResult,
  DomainEventHandlerResult,
  OrchestrationJob,
  OrchestrationMetrics,
  OrchestrationTenantScope,
} from "@/modules/platform-orchestration/types/domain-event.types";

export {
  publishDomainEvent,
  buildDomainEventInput,
  type PublishDomainEventInput,
} from "@/modules/platform-orchestration/publishers/domain-event-publisher";

export { domainEventBus } from "@/modules/platform-orchestration/bus/domain-event-bus";
export { eventDispatcher } from "@/modules/platform-orchestration/bus/event-dispatcher";
export { orchestrationService } from "@/modules/platform-orchestration/services/orchestration.service";
export { orchestrationObservabilityService } from "@/modules/platform-orchestration/services/observability.service";
export { queueProcessor } from "@/modules/platform-orchestration/workers/queue-processor";
export { ensureOrchestrationBootstrap } from "@/modules/platform-orchestration/plugins/bootstrap-orchestration";

export {
  bootstrapDomainEventRegistry,
  getDomainEventDefinition,
  listDomainEventDefinitions,
  registerDomainEventDefinition,
} from "@/modules/platform-orchestration/registry/event-registry";

export {
  registerDomainEventSubscriber,
  getSubscribersForEvent,
  listDomainEventSubscribers,
} from "@/modules/platform-orchestration/registry/subscriber-registry";

export { eventStoreRepository } from "@/modules/platform-orchestration/store/event-store.repository";
export { jobQueueRepository } from "@/modules/platform-orchestration/queue/job-queue.repository";

export {
  resolveOrchestrationScope,
  assertOrchestrationScope,
} from "@/modules/platform-orchestration/lib/orchestration-scope";

export {
  publishModuleDomainEvent,
  moduleScopeFromPlatform,
  type ModuleEventScope,
} from "@/modules/platform-orchestration/lib/publish-module-event";

export {
  runOrchestrationWorker,
  startOrchestrationWorkerInterval,
  isOrchestrationWorkerRunning,
} from "@/modules/platform-orchestration/workers/orchestration-worker";

export {
  publishDomainEventSchema,
  processQueueSchema,
  type PublishDomainEventSchemaInput,
} from "@/modules/platform-orchestration/validation/orchestration-schemas";
