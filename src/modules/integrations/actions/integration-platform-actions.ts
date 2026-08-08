"use server";

import { revalidatePath } from "next/cache";

import { INTEGRATION_MODULE_PERMISSIONS } from "@/modules/integrations/constants/permissions";
import { INTEGRATION_PLATFORM_ROUTES } from "@/modules/integrations/constants/platform-routes";
import {
  resolveIntegrationScope,
  toIntegrationPlatformContext,
} from "@/modules/integrations/lib/integration-scope";
import { integrationService } from "@/modules/integrations/services/integration.service";
import {
  connectIntegrationSchema,
  createApiKeySchema,
  createDeveloperApplicationSchema,
  createDeveloperTokenSchema,
  createIntegrationMappingSchema,
  createWebhookSchema,
  disconnectIntegrationSchema,
  retryWebhookSchema,
  revokeApiKeySchema,
  rotateApiKeySchema,
  updateWebhookSchema,
} from "@/modules/integrations/validation/integration-schemas";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";

function revalidateIntegrationPaths() {
  Object.values(INTEGRATION_PLATFORM_ROUTES).forEach((path) => revalidatePath(path));
}

export async function createApiKeyAction(input: unknown) {
  return protectedAction(INTEGRATION_MODULE_PERMISSIONS.API_CREATE, async ({ platform }) => {
    const body = createApiKeySchema.parse(input);
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const result = await integrationService.createApiKey(context, body);
    revalidateIntegrationPaths();
    return result;
  });
}

export async function revokeApiKeyAction(input: unknown) {
  return protectedAction(INTEGRATION_MODULE_PERMISSIONS.API_DELETE, async ({ platform }) => {
    const body = revokeApiKeySchema.parse(input);
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const revoked = await integrationService.revokeApiKey(context, body.apiKeyId);
    revalidateIntegrationPaths();
    return { revoked };
  });
}

export async function rotateApiKeyAction(input: unknown) {
  return protectedAction(INTEGRATION_MODULE_PERMISSIONS.API_MANAGE, async ({ platform }) => {
    const body = rotateApiKeySchema.parse(input);
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const result = await integrationService.rotateApiKey(context, body.apiKeyId);
    revalidateIntegrationPaths();
    return result;
  });
}

export async function createWebhookAction(input: unknown) {
  return protectedAction(INTEGRATION_MODULE_PERMISSIONS.API_CREATE, async ({ platform }) => {
    const body = createWebhookSchema.parse(input);
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const webhook = await integrationService.createWebhook(context, body);
    revalidateIntegrationPaths();
    return webhook;
  });
}

export async function updateWebhookAction(input: unknown) {
  return protectedAction(INTEGRATION_MODULE_PERMISSIONS.API_UPDATE, async ({ platform }) => {
    const body = updateWebhookSchema.parse(input);
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const webhook = await integrationService.updateWebhook(context, body.webhookId, body);
    revalidateIntegrationPaths();
    return webhook;
  });
}

export async function retryWebhookAction(input: unknown) {
  return protectedAction(INTEGRATION_MODULE_PERMISSIONS.API_MANAGE, async ({ platform }) => {
    const body = retryWebhookSchema.parse(input);
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const retried = await integrationService.retryWebhookDelivery(context, body);
    revalidateIntegrationPaths();
    return { retried };
  });
}

export async function connectIntegrationAction(input: unknown) {
  return protectedAction(INTEGRATION_MODULE_PERMISSIONS.API_CREATE, async ({ platform }) => {
    const body = connectIntegrationSchema.parse(input);
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const integration = await integrationService.connectIntegration(context, body);
    revalidateIntegrationPaths();
    return integration;
  });
}

export async function disconnectIntegrationAction(input: unknown) {
  return protectedAction(INTEGRATION_MODULE_PERMISSIONS.API_DELETE, async ({ platform }) => {
    const body = disconnectIntegrationSchema.parse(input);
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const disconnected = await integrationService.disconnectIntegration(context, body.integrationId);
    revalidateIntegrationPaths();
    return { disconnected };
  });
}

export async function createDeveloperApplicationAction(input: unknown) {
  return protectedAction(INTEGRATION_MODULE_PERMISSIONS.API_CREATE, async ({ platform }) => {
    const body = createDeveloperApplicationSchema.parse(input);
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const application = await integrationService.createDeveloperApplication(context, body);
    revalidateIntegrationPaths();
    return application;
  });
}

export async function createDeveloperTokenAction(input: unknown) {
  return protectedAction(INTEGRATION_MODULE_PERMISSIONS.API_CREATE, async ({ platform }) => {
    const body = createDeveloperTokenSchema.parse(input);
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const token = await integrationService.createDeveloperToken(context, body);
    revalidateIntegrationPaths();
    return token;
  });
}

export async function createIntegrationMappingAction(input: unknown) {
  return protectedAction(INTEGRATION_MODULE_PERMISSIONS.API_UPDATE, async ({ platform }) => {
    const body = createIntegrationMappingSchema.parse(input);
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const mapping = await integrationService.createIntegrationMapping(context, body);
    revalidateIntegrationPaths();
    return mapping;
  });
}

export async function runIntegrationHealthCheckAction(integrationId: string) {
  return protectedAction(INTEGRATION_MODULE_PERMISSIONS.API_READ, async ({ platform }) => {
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const integration = await integrationService.runHealthCheck(context, integrationId);
    revalidateIntegrationPaths();
    return integration;
  });
}
