import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import {
  serializeApiApplication,
  serializeApiKey,
  serializeApiRequestLog,
  serializeDeveloperSettings,
  serializeDeveloperSummary,
  serializeUsageAnalytics,
  serializeWebhookSubscription,
} from "@/modules/developer-platform-management/lib/developer-platform-validation";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getDeveloperDashboardSummary,
  getDeveloperSettings,
  listApiApplications,
  searchApiApplications,
} from "@/services/api-application.service";
import { listApiKeys } from "@/services/api-key-manager.service";
import {
  listWebhookSubscriptions,
  searchWebhookSubscriptions,
} from "@/services/api-webhook-subscription-manager.service";
import {
  getUsageAnalytics,
  listApiRequestLogs,
  searchApiRequestLogs,
} from "@/services/api-request-logger.service";
import { API_ROUTE_CATALOG, SDK_FRAMEWORK_LANGUAGES } from "@/services/api-version-manager.service";
import { resolveDeveloperPlatformPermissions } from "@/services/developer-platform-permission.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface DeveloperPlatformContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ReturnType<typeof resolveDeveloperPlatformPermissions>;
}

async function resolveDeveloperBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getDeveloperPlatformContext = cache(async (): Promise<DeveloperPlatformContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveDeveloperBusiness(user);
  const permissionsFlags = resolveDeveloperPlatformPermissions(
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
});

export async function requireDeveloperPlatformActionContext(
  permission: string,
): Promise<DeveloperPlatformContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveDeveloperBusiness(user);
  const permissionsFlags = resolveDeveloperPlatformPermissions(
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

export const getDeveloperDashboardContext = cache(async () => {
  const context = await getDeveloperPlatformContext();
  const summary = await getDeveloperDashboardSummary(context.user.id);
  const applications = await listApiApplications(context.user.id);
  return {
    ...context,
    summary: serializeDeveloperSummary(summary),
    applications: applications
      .filter((app) => app.name !== "__developer_settings__")
      .map(serializeApiApplication),
  };
});

export const getDeveloperApplicationsContext = cache(async () => {
  const context = await getDeveloperPlatformContext();
  const applications = await listApiApplications(context.user.id);
  return {
    ...context,
    applications: applications
      .filter((app) => app.name !== "__developer_settings__")
      .map(serializeApiApplication),
  };
});

export const getDeveloperKeysContext = cache(async () => {
  const context = await getDeveloperPlatformContext();
  const [keys, applications] = await Promise.all([
    listApiKeys(context.user.id),
    listApiApplications(context.user.id),
  ]);
  return {
    ...context,
    keys: keys.map(serializeApiKey),
    applications: applications
      .filter((app) => app.name !== "__developer_settings__")
      .map(serializeApiApplication),
  };
});

export const getDeveloperWebhooksContext = cache(async () => {
  const context = await getDeveloperPlatformContext();
  const [webhooks, applications] = await Promise.all([
    listWebhookSubscriptions(context.user.id),
    listApiApplications(context.user.id),
  ]);
  return {
    ...context,
    webhooks: webhooks.map(serializeWebhookSubscription),
    applications: applications
      .filter((app) => app.name !== "__developer_settings__")
      .map(serializeApiApplication),
  };
});

export const getDeveloperExplorerContext = cache(async () => {
  const context = await getDeveloperPlatformContext();
  return { ...context, routes: API_ROUTE_CATALOG.slice(0, 12) };
});

export const getDeveloperAnalyticsContext = cache(async () => {
  const context = await getDeveloperPlatformContext();
  const analytics = await getUsageAnalytics(context.user.id);
  return { ...context, analytics: serializeUsageAnalytics(analytics) };
});

export const getDeveloperLogsContext = cache(async () => {
  const context = await getDeveloperPlatformContext();
  const logs = await listApiRequestLogs(context.user.id);
  return { ...context, logs: logs.map(serializeApiRequestLog) };
});

export const getDeveloperSettingsContext = cache(async () => {
  const context = await getDeveloperPlatformContext();
  const settings = await getDeveloperSettings(context.user.id);
  return {
    ...context,
    settings: serializeDeveloperSettings(settings),
    sdkLanguages: SDK_FRAMEWORK_LANGUAGES,
  };
});

export const getDeveloperSearchContext = cache(async (query?: string) => {
  const context = await getDeveloperPlatformContext();
  const trimmed = query?.trim() ?? "";
  if (!trimmed) {
    return { ...context, search: "", results: { applications: [], webhooks: [], logs: [] } };
  }

  const [applications, webhooks, logs] = await Promise.all([
    searchApiApplications(context.user.id, trimmed),
    searchWebhookSubscriptions(context.user.id, trimmed),
    searchApiRequestLogs(context.user.id, trimmed),
  ]);

  return {
    ...context,
    search: trimmed,
    results: {
      applications: applications.map(serializeApiApplication),
      webhooks: webhooks.map((webhook) =>
        serializeWebhookSubscription({ ...webhook, application: undefined }),
      ),
      logs: logs.map((log) => serializeApiRequestLog({ ...log, application: null })),
    },
  };
});
