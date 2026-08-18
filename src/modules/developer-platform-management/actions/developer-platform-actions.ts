"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { DEVELOPER_PLATFORM_ROUTES } from "@/modules/developer-platform-management/constants/routes";
import { requireDeveloperPlatformActionContext } from "@/modules/developer-platform-management/lib/get-developer-platform-context";
import {
  validateApplicationName,
  validateWebhookEndpoint,
} from "@/modules/developer-platform-management/lib/developer-platform-validation";
import {
  createApiApplication,
  deleteApiApplication,
  rotateApplicationSecret,
  updateApiApplication,
  updateDeveloperSettings,
} from "@/services/api-application.service";
import { createApiKey, revokeApiKey, rotateApiKey } from "@/services/api-key-manager.service";
import {
  createWebhookSubscription,
  deleteWebhookSubscription,
  updateWebhookSubscriptionStatus,
} from "@/services/api-webhook-subscription-manager.service";
import { executeApiExplorerRequest } from "@/services/developer-portal.service";
import { listWebhookDeliveryLog } from "@/modules/platform/lib/webhook-delivery-log";
import { replayWebhookDelivery } from "@/modules/platform/services/platform-webhook-delivery.service";
import { getOwnedBusinessId } from "@/services/developer-platform-context.service";

function revalidateDeveloperPages(): void {
  const routes = [
    DEVELOPER_PLATFORM_ROUTES.dashboard(),
    DEVELOPER_PLATFORM_ROUTES.applications(),
    DEVELOPER_PLATFORM_ROUTES.keys(),
    DEVELOPER_PLATFORM_ROUTES.webhooks(),
    DEVELOPER_PLATFORM_ROUTES.explorer(),
    DEVELOPER_PLATFORM_ROUTES.analytics(),
    DEVELOPER_PLATFORM_ROUTES.logs(),
    DEVELOPER_PLATFORM_ROUTES.settings(),
    DEVELOPER_PLATFORM_ROUTES.search(),
  ];
  for (const route of routes) revalidatePath(route);
}

export async function createApiApplicationAction(input: {
  name: string;
  description?: string;
  apiVersion?: "V1" | "V2";
}) {
  const context = await requireDeveloperPlatformActionContext(PERMISSION_CODES.DEVELOPER_CREATE);
  await createApiApplication(context.user.id, {
    ...input,
    name: validateApplicationName(input.name),
  });
  revalidateDeveloperPages();
}

export async function updateApiApplicationAction(
  applicationId: string,
  input: { name?: string; status?: "ACTIVE" | "DISABLED" | "REVOKED" },
) {
  const context = await requireDeveloperPlatformActionContext(PERMISSION_CODES.DEVELOPER_UPDATE);
  await updateApiApplication(context.user.id, applicationId, input);
  revalidateDeveloperPages();
}

export async function deleteApiApplicationAction(applicationId: string) {
  const context = await requireDeveloperPlatformActionContext(PERMISSION_CODES.DEVELOPER_DELETE);
  await deleteApiApplication(context.user.id, applicationId);
  revalidateDeveloperPages();
}

export async function rotateApplicationSecretAction(applicationId: string) {
  const context = await requireDeveloperPlatformActionContext(PERMISSION_CODES.DEVELOPER_MANAGE);
  return rotateApplicationSecret(context.user.id, applicationId);
}

export async function createApiKeyAction(input: {
  applicationId: string;
  name: string;
  permissions?: string[];
  expiresAt?: string;
}) {
  const context = await requireDeveloperPlatformActionContext(PERMISSION_CODES.DEVELOPER_CREATE);
  const result = await createApiKey(context.user.id, {
    applicationId: input.applicationId,
    name: input.name,
    permissions: input.permissions,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
  });
  revalidateDeveloperPages();
  return result ? { id: result.id, rawKey: result.rawKey } : { id: "", rawKey: "" };
}

export async function revokeApiKeyAction(keyId: string) {
  const context = await requireDeveloperPlatformActionContext(PERMISSION_CODES.DEVELOPER_DELETE);
  await revokeApiKey(context.user.id, keyId);
  revalidateDeveloperPages();
}

export async function rotateApiKeyAction(keyId: string) {
  const context = await requireDeveloperPlatformActionContext(PERMISSION_CODES.DEVELOPER_MANAGE);
  const result = await rotateApiKey(context.user.id, keyId);
  revalidateDeveloperPages();
  return result ? { id: result.id, rawKey: result.rawKey } : { id: "", rawKey: "" };
}

export async function createWebhookAction(input: {
  applicationId: string;
  event: string;
  endpoint: string;
}) {
  const context = await requireDeveloperPlatformActionContext(PERMISSION_CODES.DEVELOPER_CREATE);
  const result = await createWebhookSubscription(context.user.id, {
    ...input,
    endpoint: validateWebhookEndpoint(input.endpoint),
  });
  revalidateDeveloperPages();
  return result ? { id: result.subscription.id, secret: result.secret } : null;
}

export async function disableWebhookAction(subscriptionId: string) {
  const context = await requireDeveloperPlatformActionContext(PERMISSION_CODES.DEVELOPER_UPDATE);
  await updateWebhookSubscriptionStatus(context.user.id, subscriptionId, "DISABLED");
  revalidateDeveloperPages();
}

export async function deleteWebhookAction(subscriptionId: string) {
  const context = await requireDeveloperPlatformActionContext(PERMISSION_CODES.DEVELOPER_DELETE);
  await deleteWebhookSubscription(context.user.id, subscriptionId);
  revalidateDeveloperPages();
}

export async function updateDeveloperSettingsAction(input: {
  rateLimitPerMinute?: number;
  ipAllowList?: string[];
  defaultApiVersion?: "V1" | "V2";
}) {
  const context = await requireDeveloperPlatformActionContext(PERMISSION_CODES.DEVELOPER_MANAGE);
  await updateDeveloperSettings(context.user.id, input);
  revalidateDeveloperPages();
}

export async function executeExplorerAction(input: {
  method: string;
  path: string;
  apiKey: string;
  body?: string;
}) {
  const context = await requireDeveloperPlatformActionContext(PERMISSION_CODES.DEVELOPER_VIEW);
  return executeApiExplorerRequest(context.user.id, input);
}

/** @deprecated Use executeExplorerAction */
export async function simulateExplorerAction(input: {
  method: string;
  path: string;
  apiKey?: string;
  body?: string;
}) {
  if (!input.apiKey?.trim()) {
    throw new Error("An API key is required to execute live requests.");
  }

  return executeExplorerAction({
    method: input.method,
    path: input.path,
    apiKey: input.apiKey,
    body: input.body,
  });
}

export async function listWebhookDeliveriesAction(limit = 50) {
  const context = await requireDeveloperPlatformActionContext(PERMISSION_CODES.DEVELOPER_VIEW);
  const businessId = await getOwnedBusinessId(context.user.id);
  return listWebhookDeliveryLog(businessId, limit);
}

export async function replayWebhookDeliveryAction(deliveryId: string) {
  const context = await requireDeveloperPlatformActionContext(PERMISSION_CODES.DEVELOPER_MANAGE);
  const businessId = await getOwnedBusinessId(context.user.id);
  const result = await replayWebhookDelivery(businessId, deliveryId);
  revalidateDeveloperPages();
  return result;
}
