import { z } from "zod";

import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";

export const publishDomainEventSchema = z.object({
  eventType: z.string().trim().min(3),
  aggregateId: z.string().trim().min(1),
  payload: z.record(z.unknown()).default({}),
  idempotencyKey: z.string().trim().min(1).optional(),
  correlationId: z.string().trim().optional(),
  causationId: z.string().trim().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const processQueueSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const orchestrationMetricsQuerySchema = z.object({
  branchId: z.string().trim().optional(),
});

export const listEventsQuerySchema = z.object({
  eventType: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type PublishDomainEventSchemaInput = z.infer<typeof publishDomainEventSchema>;
export type ProcessQueueSchemaInput = z.infer<typeof processQueueSchema>;

export const KNOWN_EVENT_TYPES = Object.values(DOMAIN_EVENT_TYPES);
