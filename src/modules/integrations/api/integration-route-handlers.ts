import "server-only";

import { NextResponse } from "next/server";

import { INTEGRATION_MODULE_PERMISSIONS } from "@/modules/integrations/constants/permissions";
import {
  resolveIntegrationScope,
  toIntegrationPlatformContext,
} from "@/modules/integrations/lib/integration-scope";
import { integrationService } from "@/modules/integrations/services/integration.service";
import { buildIntegrationPlatformSnapshot } from "@/modules/integrations/services/integration-platform.service";
import {
  connectIntegrationSchema,
  createApiKeySchema,
  createDeveloperApplicationSchema,
  createDeveloperTokenSchema,
  createIntegrationMappingSchema,
  createWebhookSchema,
  disconnectIntegrationSchema,
  integrationSearchSchema,
  retryWebhookSchema,
  revokeApiKeySchema,
  rotateApiKeySchema,
  updateWebhookSchema,
  webhookVerificationSchema,
} from "@/modules/integrations/validation/integration-schemas";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";

function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export async function handleListIntegrations(request: Request) {
  try {
    const platform = await protectedRoute({ permission: INTEGRATION_MODULE_PERMISSIONS.API_READ });
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const url = new URL(request.url);
    const parsed = integrationSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));

    if (url.searchParams.get("snapshot") === "true") {
      return jsonSuccess(await buildIntegrationPlatformSnapshot(context));
    }

    const [integrations, record] = await Promise.all([
      integrationService.searchIntegrations(context, parsed),
      integrationService.getRecord(context),
    ]);

    return jsonSuccess({
      integrations,
      providers: record.providers,
      apiKeys: record.apiKeys,
      webhooks: record.webhooks,
      analytics: record.developerAnalytics,
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateApiKey(request: Request) {
  try {
    const platform = await protectedRoute({ permission: INTEGRATION_MODULE_PERMISSIONS.API_CREATE });
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const body = createApiKeySchema.parse(await request.json());
    const result = await integrationService.createApiKey(context, body);
    return jsonSuccess(result, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleRevokeApiKey(request: Request) {
  try {
    const platform = await protectedRoute({ permission: INTEGRATION_MODULE_PERMISSIONS.API_DELETE });
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const body = revokeApiKeySchema.parse(await request.json());
    const revoked = await integrationService.revokeApiKey(context, body.apiKeyId);
    return jsonSuccess({ revoked });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleRotateApiKey(request: Request) {
  try {
    const platform = await protectedRoute({ permission: INTEGRATION_MODULE_PERMISSIONS.API_MANAGE });
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const body = rotateApiKeySchema.parse(await request.json());
    const result = await integrationService.rotateApiKey(context, body.apiKeyId);
    return jsonSuccess(result);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateWebhook(request: Request) {
  try {
    const platform = await protectedRoute({ permission: INTEGRATION_MODULE_PERMISSIONS.API_CREATE });
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const body = createWebhookSchema.parse(await request.json());
    const webhook = await integrationService.createWebhook(context, body);
    return jsonSuccess(webhook, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleUpdateWebhook(request: Request) {
  try {
    const platform = await protectedRoute({ permission: INTEGRATION_MODULE_PERMISSIONS.API_UPDATE });
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const body = updateWebhookSchema.parse(await request.json());
    const webhook = await integrationService.updateWebhook(context, body.webhookId, body);
    if (!webhook) {
      return NextResponse.json({ success: false, error: "Webhook not found" }, { status: 404 });
    }
    return jsonSuccess(webhook);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleRetryWebhook(request: Request) {
  try {
    const platform = await protectedRoute({ permission: INTEGRATION_MODULE_PERMISSIONS.API_MANAGE });
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const body = retryWebhookSchema.parse(await request.json());
    const retried = await integrationService.retryWebhookDelivery(context, body);
    return jsonSuccess({ retried });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleVerifyWebhook(request: Request) {
  try {
    const platform = await protectedRoute({ permission: INTEGRATION_MODULE_PERMISSIONS.API_READ });
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const body = webhookVerificationSchema.parse(await request.json());
    const verified = await integrationService.verifyWebhookSignature(context, body);
    return jsonSuccess({ verified });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleConnectIntegration(request: Request) {
  try {
    const platform = await protectedRoute({ permission: INTEGRATION_MODULE_PERMISSIONS.API_CREATE });
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const body = connectIntegrationSchema.parse(await request.json());
    const integration = await integrationService.connectIntegration(context, body);
    return jsonSuccess(integration, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleDisconnectIntegration(request: Request) {
  try {
    const platform = await protectedRoute({ permission: INTEGRATION_MODULE_PERMISSIONS.API_DELETE });
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const body = disconnectIntegrationSchema.parse(await request.json());
    const disconnected = await integrationService.disconnectIntegration(context, body.integrationId);
    return jsonSuccess({ disconnected });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleHealthCheck(request: Request, integrationId: string) {
  try {
    const platform = await protectedRoute({ permission: INTEGRATION_MODULE_PERMISSIONS.API_READ });
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const integration = await integrationService.runHealthCheck(context, integrationId);
    if (!integration) {
      return NextResponse.json({ success: false, error: "Integration not found" }, { status: 404 });
    }
    return jsonSuccess(integration);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateDeveloperApplication(request: Request) {
  try {
    const platform = await protectedRoute({ permission: INTEGRATION_MODULE_PERMISSIONS.API_CREATE });
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const body = createDeveloperApplicationSchema.parse(await request.json());
    const application = await integrationService.createDeveloperApplication(context, body);
    return jsonSuccess(application, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateDeveloperToken(request: Request) {
  try {
    const platform = await protectedRoute({ permission: INTEGRATION_MODULE_PERMISSIONS.API_CREATE });
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const body = createDeveloperTokenSchema.parse(await request.json());
    const token = await integrationService.createDeveloperToken(context, body);
    return jsonSuccess(token, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateMapping(request: Request) {
  try {
    const platform = await protectedRoute({ permission: INTEGRATION_MODULE_PERMISSIONS.API_UPDATE });
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const body = createIntegrationMappingSchema.parse(await request.json());
    const mapping = await integrationService.createIntegrationMapping(context, body);
    return jsonSuccess(mapping, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleIntegrationUsage(_request: Request) {
  try {
    const platform = await protectedRoute({ permission: INTEGRATION_MODULE_PERMISSIONS.API_READ });
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const record = await integrationService.getRecord(context);
    return jsonSuccess({
      usage: record.apiUsage,
      rateLimits: record.rateLimits,
      requests: record.apiRequests.slice(0, 100),
      analytics: record.developerAnalytics,
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleIntegrationWebhooks(_request: Request) {
  try {
    const platform = await protectedRoute({ permission: INTEGRATION_MODULE_PERMISSIONS.API_READ });
    const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
    const record = await integrationService.getRecord(context);
    const failed = await integrationService.getFailedWebhookEvents(context);
    return jsonSuccess({
      webhooks: record.webhooks,
      events: record.webhookEvents.slice(0, 100),
      failed,
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
