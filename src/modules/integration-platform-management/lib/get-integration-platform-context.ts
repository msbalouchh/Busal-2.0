import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import {
  serializeIntegrationConnection,
  serializeIntegrationLog,
  serializeIntegrationProvider,
  serializeIntegrationSyncJob,
  serializeIntegrationWebhook,
} from "@/modules/integration-platform-management/lib/integration-platform-validation";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  listIntegrationConnections,
  getIntegrationConnection,
} from "@/services/integration-connection-manager.service";
import {
  getIntegrationDashboardSummary,
  getIntegrationHealthSnapshot,
} from "@/services/integration-health-monitor.service";
import { listIntegrationLogs } from "@/services/integration-logger.service";
import { listIntegrationProviders } from "@/services/integration-registry.service";
import { listIntegrationSyncJobs } from "@/services/integration-sync-manager.service";
import { listIntegrationWebhooks } from "@/services/integration-webhook-manager.service";
import { resolveIntegrationPlatformPermissions } from "@/services/integration-platform-permission.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface IntegrationPlatformContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ReturnType<typeof resolveIntegrationPlatformPermissions>;
}

async function resolveIntegrationBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getIntegrationPlatformContext = cache(
  async (): Promise<IntegrationPlatformContext> => {
    const user = await requireApplicationAccess();
    const loaded = await resolveIntegrationBusiness(user);
    const permissionsFlags = resolveIntegrationPlatformPermissions(
      loaded.authorization.permissions,
      loaded.authorization.isOwner,
    );

    if (!permissionsFlags.canView) redirect(ROUTES.application);

    return {
      user,
      business: loaded.business,
      authorization: loaded.authorization,
      permissionsFlags,
    };
  },
);

export async function requireIntegrationPlatformActionContext(
  permission: string,
): Promise<IntegrationPlatformContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveIntegrationBusiness(user);
  const permissionsFlags = resolveIntegrationPlatformPermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );

  const allowed = loaded.authorization.isOwner || loaded.authorization.permissions.has(permission);
  if (!allowed) throw permissionDenied();

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
  };
}

export const getIntegrationDashboardContext = cache(async () => {
  const context = await getIntegrationPlatformContext();
  const summary = await getIntegrationDashboardSummary(context.user.id);
  return {
    ...context,
    health: summary.health,
    providers: summary.providers.items.map(serializeIntegrationProvider),
    connections: summary.connections.items.map(serializeIntegrationConnection),
    webhooks: summary.webhooks.items.map(serializeIntegrationWebhook),
    syncJobs: summary.syncJobs.items.map(serializeIntegrationSyncJob),
    logs: summary.logs.items.map(serializeIntegrationLog),
  };
});

export const getIntegrationProvidersContext = cache(async () => {
  const context = await getIntegrationPlatformContext();
  const providers = await listIntegrationProviders(context.user.id);
  return { ...context, providers: providers.map(serializeIntegrationProvider) };
});

export const getIntegrationConnectionsContext = cache(async () => {
  const context = await getIntegrationPlatformContext();
  const connections = await listIntegrationConnections(context.user.id);
  return { ...context, connections: connections.map(serializeIntegrationConnection) };
});

export const getIntegrationConnectionDetailContext = cache(async (connectionId: string) => {
  const context = await getIntegrationPlatformContext();
  const connection = await getIntegrationConnection(context.user.id, connectionId);
  const logs = await listIntegrationLogs(context.user.id, { connectionId, limit: 20 });
  return {
    ...context,
    connection: connection ? serializeIntegrationConnection(connection) : null,
    logs: logs.map(serializeIntegrationLog),
  };
});

export const getIntegrationConnectionWizardContext = cache(async () => {
  const context = await getIntegrationPlatformContext();
  const providers = await listIntegrationProviders(context.user.id);
  return { ...context, providers: providers.map(serializeIntegrationProvider) };
});

export const getIntegrationWebhooksContext = cache(async () => {
  const context = await getIntegrationPlatformContext();
  const [webhooks, providers] = await Promise.all([
    listIntegrationWebhooks(context.user.id),
    listIntegrationProviders(context.user.id),
  ]);
  return {
    ...context,
    webhooks: webhooks.map(serializeIntegrationWebhook),
    providers: providers.map(serializeIntegrationProvider),
  };
});

export const getIntegrationSyncContext = cache(async () => {
  const context = await getIntegrationPlatformContext();
  const syncJobs = await listIntegrationSyncJobs(context.user.id);
  return { ...context, syncJobs: syncJobs.map(serializeIntegrationSyncJob) };
});

export const getIntegrationLogsContext = cache(async () => {
  const context = await getIntegrationPlatformContext();
  const logs = await listIntegrationLogs(context.user.id, { limit: 100 });
  return { ...context, logs: logs.map(serializeIntegrationLog) };
});

export const getIntegrationHealthContext = cache(async () => {
  const context = await getIntegrationPlatformContext();
  const health = await getIntegrationHealthSnapshot(context.user.id);
  return { ...context, health };
});

export const getIntegrationSearchContext = cache(async (search = "") => {
  const context = await getIntegrationPlatformContext();
  const trimmed = search.trim();
  const [providers, connections, logs] = trimmed
    ? await Promise.all([
        listIntegrationProviders(context.user.id),
        listIntegrationConnections(context.user.id),
        listIntegrationLogs(context.user.id, { search: trimmed, limit: 20 }),
      ])
    : [[], [], []];

  const providerMatches = providers
    .filter(
      (p) =>
        p.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        p.slug.toLowerCase().includes(trimmed.toLowerCase()),
    )
    .map(serializeIntegrationProvider);

  const connectionMatches = connections
    .filter((c) => c.displayName.toLowerCase().includes(trimmed.toLowerCase()))
    .map(serializeIntegrationConnection);

  return {
    ...context,
    search: trimmed,
    results: {
      providers: providerMatches,
      connections: connectionMatches,
      logs: logs.map(serializeIntegrationLog),
    },
  };
});
