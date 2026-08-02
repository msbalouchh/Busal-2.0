"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { INTEGRATION_PLATFORM_ROUTES } from "@/modules/integration-platform-management/constants/routes";
import { requireIntegrationPlatformActionContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";
import {
  createIntegrationConnection,
  deleteIntegrationConnection,
  testIntegrationConnection,
  updateIntegrationConnection,
} from "@/services/integration-connection-manager.service";
import { rotateConnectionCredentials } from "@/services/integration-credential-manager.service";
import {
  createIntegrationWebhook,
  deleteIntegrationWebhook,
  updateIntegrationWebhookStatus,
} from "@/services/integration-webhook-manager.service";
import { triggerManualSync } from "@/services/integration-sync-manager.service";
import { retryFailedSyncJobs } from "@/services/integration-retry-queue.service";

function revalidateIntegrationPages(connectionId?: string): void {
  const routes = [
    INTEGRATION_PLATFORM_ROUTES.dashboard(),
    INTEGRATION_PLATFORM_ROUTES.providers(),
    INTEGRATION_PLATFORM_ROUTES.connections(),
    INTEGRATION_PLATFORM_ROUTES.connectionNew(),
    INTEGRATION_PLATFORM_ROUTES.webhooks(),
    INTEGRATION_PLATFORM_ROUTES.sync(),
    INTEGRATION_PLATFORM_ROUTES.logs(),
    INTEGRATION_PLATFORM_ROUTES.health(),
    INTEGRATION_PLATFORM_ROUTES.search(),
  ];
  for (const route of routes) revalidatePath(route);
  if (connectionId) revalidatePath(INTEGRATION_PLATFORM_ROUTES.connectionDetail(connectionId));
}

export async function createIntegrationConnectionAction(input: {
  providerId: string;
  displayName: string;
  apiKey?: string;
  apiSecret?: string;
}) {
  const context = await requireIntegrationPlatformActionContext(
    PERMISSION_CODES.INTEGRATION_CREATE,
  );
  const credentials: Record<string, string> = {};
  if (input.apiKey) credentials.apiKey = input.apiKey;
  if (input.apiSecret) credentials.apiSecret = input.apiSecret;

  const connection = await createIntegrationConnection(context.user.id, {
    providerId: input.providerId,
    displayName: input.displayName,
    credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
  });
  revalidateIntegrationPages(connection.id);
  return serializeConnection(connection);
}

export async function updateIntegrationConnectionAction(
  connectionId: string,
  input: { displayName?: string; status?: "ACTIVE" | "INACTIVE" | "DISCONNECTED" },
) {
  const context = await requireIntegrationPlatformActionContext(
    PERMISSION_CODES.INTEGRATION_UPDATE,
  );
  const connection = await updateIntegrationConnection(context.user.id, connectionId, input);
  revalidateIntegrationPages(connectionId);
  return connection ? serializeConnection(connection) : null;
}

export async function deleteIntegrationConnectionAction(connectionId: string) {
  const context = await requireIntegrationPlatformActionContext(
    PERMISSION_CODES.INTEGRATION_DELETE,
  );
  await deleteIntegrationConnection(context.user.id, connectionId);
  revalidateIntegrationPages(connectionId);
}

export async function testIntegrationConnectionAction(connectionId: string) {
  const context = await requireIntegrationPlatformActionContext(
    PERMISSION_CODES.INTEGRATION_MANAGE,
  );
  const result = await testIntegrationConnection(context.user.id, connectionId);
  revalidateIntegrationPages(connectionId);
  return result;
}

export async function rotateCredentialsAction(
  connectionId: string,
  credentials: { apiKey?: string; apiSecret?: string },
) {
  const context = await requireIntegrationPlatformActionContext(
    PERMISSION_CODES.INTEGRATION_MANAGE,
  );
  const payload: Record<string, string> = {};
  if (credentials.apiKey) payload.apiKey = credentials.apiKey;
  if (credentials.apiSecret) payload.apiSecret = credentials.apiSecret;
  await rotateConnectionCredentials(context.user.id, connectionId, payload);
  revalidateIntegrationPages(connectionId);
}

export async function createIntegrationWebhookAction(input: {
  providerId: string;
  event: string;
  endpoint: string;
}) {
  const context = await requireIntegrationPlatformActionContext(
    PERMISSION_CODES.INTEGRATION_CREATE,
  );
  const result = await createIntegrationWebhook(context.user.id, input);
  revalidateIntegrationPages();
  return result;
}

export async function deleteIntegrationWebhookAction(webhookId: string) {
  const context = await requireIntegrationPlatformActionContext(
    PERMISSION_CODES.INTEGRATION_DELETE,
  );
  await deleteIntegrationWebhook(context.user.id, webhookId);
  revalidateIntegrationPages();
}

export async function toggleIntegrationWebhookAction(webhookId: string, active: boolean) {
  const context = await requireIntegrationPlatformActionContext(
    PERMISSION_CODES.INTEGRATION_UPDATE,
  );
  await updateIntegrationWebhookStatus(context.user.id, webhookId, active ? "ACTIVE" : "INACTIVE");
  revalidateIntegrationPages();
}

export async function triggerSyncAction(connectionId: string) {
  const context = await requireIntegrationPlatformActionContext(
    PERMISSION_CODES.INTEGRATION_MANAGE,
  );
  const job = await triggerManualSync(context.user.id, connectionId);
  revalidateIntegrationPages(connectionId);
  return job;
}

export async function retryFailedSyncsAction() {
  const context = await requireIntegrationPlatformActionContext(
    PERMISSION_CODES.INTEGRATION_MANAGE,
  );
  const count = await retryFailedSyncJobs(context.user.id);
  revalidateIntegrationPages();
  return { retried: count };
}

function serializeConnection(connection: {
  id: string;
  businessId: string;
  providerId: string;
  displayName: string;
  status: string;
  configuration: unknown;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  provider: { name: string; slug: string; category: string };
}) {
  return {
    id: connection.id,
    displayName: connection.displayName,
    status: connection.status,
    providerName: connection.provider.name,
  };
}
