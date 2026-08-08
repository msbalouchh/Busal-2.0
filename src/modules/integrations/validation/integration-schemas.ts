import { z } from "zod";

import {
  DEVELOPER_SCOPES,
  INTEGRATION_CATEGORIES,
  INTEGRATION_STATUSES,
} from "@/modules/integrations/constants/integration-status";

export const integrationSearchSchema = z.object({
  query: z.string().optional(),
  category: z.nativeEnum(INTEGRATION_CATEGORIES).optional(),
  status: z.nativeEnum(INTEGRATION_STATUSES).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1),
  scopes: z.array(z.string()).min(1),
  rateLimitPerHour: z.coerce.number().int().min(1).max(100000).optional(),
  expiresAt: z.string().nullable().optional(),
});

export const revokeApiKeySchema = z.object({
  apiKeyId: z.string().min(1),
});

export const rotateApiKeySchema = z.object({
  apiKeyId: z.string().min(1),
});

export const createWebhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  eventTypes: z.array(z.string()).min(1),
});

export const updateWebhookSchema = z.object({
  webhookId: z.string().min(1),
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  eventTypes: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const retryWebhookSchema = z.object({
  deliveryId: z.string().min(1),
});

export const webhookVerificationSchema = z.object({
  webhookId: z.string().min(1),
  signature: z.string().min(1),
  payload: z.record(z.unknown()),
  timestamp: z.string().optional(),
});

export const connectIntegrationSchema = z.object({
  providerSlug: z.string().min(1),
  displayName: z.string().min(1),
  credentials: z.record(z.string()).default({}),
  configuration: z.record(z.string()).default({}),
});

export const disconnectIntegrationSchema = z.object({
  integrationId: z.string().min(1),
});

export const createDeveloperApplicationSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  redirectUris: z.array(z.string()).default([]),
  scopes: z.array(z.nativeEnum(DEVELOPER_SCOPES)).min(1),
  webhookUrl: z.string().url().nullable().optional(),
});

export const createDeveloperTokenSchema = z.object({
  applicationId: z.string().min(1),
  scopes: z.array(z.nativeEnum(DEVELOPER_SCOPES)).min(1),
  expiresAt: z.string(),
});

export const createIntegrationMappingSchema = z.object({
  integrationId: z.string().min(1),
  sourceEntity: z.string().min(1),
  targetEntity: z.string().min(1),
  fieldMappings: z
    .array(
      z.object({
        sourceField: z.string(),
        targetField: z.string(),
        transform: z.string().nullable(),
      }),
    )
    .default([]),
});

export const updateRateLimitSchema = z.object({
  policyId: z.string().min(1),
  requestsPerMinute: z.coerce.number().int().min(1).optional(),
  burstLimit: z.coerce.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type IntegrationSearchSchemaInput = z.infer<typeof integrationSearchSchema>;
export type CreateApiKeySchemaInput = z.infer<typeof createApiKeySchema>;
export type CreateWebhookSchemaInput = z.infer<typeof createWebhookSchema>;
export type ConnectIntegrationSchemaInput = z.infer<typeof connectIntegrationSchema>;
export type CreateDeveloperApplicationSchemaInput = z.infer<typeof createDeveloperApplicationSchema>;
export type CreateDeveloperTokenSchemaInput = z.infer<typeof createDeveloperTokenSchema>;
export type CreateIntegrationMappingSchemaInput = z.infer<typeof createIntegrationMappingSchema>;
export type RetryWebhookSchemaInput = z.infer<typeof retryWebhookSchema>;
export type WebhookVerificationSchemaInput = z.infer<typeof webhookVerificationSchema>;
