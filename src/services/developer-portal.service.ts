import "server-only";

import {
  getDeveloperDashboardSummary,
  getDeveloperSettings,
  listApiApplications,
} from "@/services/api-application.service";
import { listApiKeys } from "@/services/api-key-manager.service";
import { listWebhookSubscriptions } from "@/services/api-webhook-subscription-manager.service";
import { getUsageAnalytics } from "@/services/api-request-logger.service";
import { getOwnedBusinessId } from "@/services/developer-platform-context.service";
import { validateApiKey } from "@/services/api-key-manager.service";
import { API_ROUTE_CATALOG, SDK_FRAMEWORK_LANGUAGES } from "@/services/api-version-manager.service";
import { buildAppUrl } from "@/config/app-url";

export async function getDeveloperPortalOverview(ownerId: string) {
  const [summary, applications, keys, webhooks, analytics, settings] = await Promise.all([
    getDeveloperDashboardSummary(ownerId),
    listApiApplications(ownerId),
    listApiKeys(ownerId),
    listWebhookSubscriptions(ownerId),
    getUsageAnalytics(ownerId),
    getDeveloperSettings(ownerId),
  ]);

  return {
    summary,
    applications: applications.filter((app) => app.name !== "__developer_settings__"),
    keys,
    webhooks,
    analytics,
    settings,
    routeCatalogCount: API_ROUTE_CATALOG.length,
    sdkLanguages: SDK_FRAMEWORK_LANGUAGES,
  };
}

function normalizeExplorerPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/")) {
    return `/api/v1/${trimmed}`;
  }

  if (trimmed.startsWith("/api/v1")) {
    return trimmed;
  }

  return `/api/v1${trimmed}`;
}

export async function executeApiExplorerRequest(
  ownerId: string,
  input: { method: string; path: string; apiKey: string; body?: string },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const apiKey = input.apiKey.trim();

  if (!apiKey.startsWith("bk_")) {
    throw new Error("Invalid API key format.");
  }

  const keyRecord = await validateApiKey(apiKey);
  if (!keyRecord) {
    throw new Error("Invalid or expired API key.");
  }

  if (keyRecord.businessId !== businessId) {
    throw new Error("API key does not belong to this workspace.");
  }

  const normalizedPath = normalizeExplorerPath(input.path);
  if (!normalizedPath.startsWith("/api/v1/")) {
    throw new Error("Only /api/v1 routes can be tested from the explorer.");
  }

  const method = input.method.toUpperCase();
  const url = buildAppUrl(normalizedPath);

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      ...(method !== "GET" && method !== "HEAD" && input.body
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body: method !== "GET" && method !== "HEAD" && input.body ? input.body : undefined,
    cache: "no-store",
  });

  const responseText = await response.text();
  let parsedBody: unknown = responseText;

  try {
    parsedBody = JSON.parse(responseText);
  } catch {
    parsedBody = responseText;
  }

  return {
    method,
    path: normalizedPath,
    status: response.status,
    ok: response.ok,
    body: parsedBody,
    rateLimit: {
      limit: response.headers.get("X-RateLimit-Limit"),
      remaining: response.headers.get("X-RateLimit-Remaining"),
      reset: response.headers.get("X-RateLimit-Reset"),
    },
  };
}

/** @deprecated Use executeApiExplorerRequest */
export async function simulateApiExplorerRequest(
  ownerId: string,
  input: { method: string; path: string; apiKey?: string },
) {
  if (!input.apiKey?.trim()) {
    return {
      error: "An API key is required to execute live requests.",
      method: input.method.toUpperCase(),
      path: input.path,
    };
  }

  return executeApiExplorerRequest(ownerId, {
    method: input.method,
    path: input.path,
    apiKey: input.apiKey,
  });
}
