"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { IntegrationContext } from "@/modules/integrations/contexts/integration-context";
import { buildIntegrationPlatformContext } from "@/modules/integrations/services/integration-platform.service";
import type { IntegrationPlatformSnapshot } from "@/modules/integrations/services/integration-platform.service";
import type { IntegrationContextValue, IntegrationPlatformContext } from "@/modules/integrations/types/integration-platform";

interface IntegrationProviderProps {
  children: ReactNode;
  initialInput?: IntegrationPlatformContext;
  initialSnapshot?: IntegrationPlatformSnapshot;
}

export function IntegrationProvider({ children, initialInput, initialSnapshot }: IntegrationProviderProps) {
  const [input] = useState<IntegrationPlatformContext>(
    () =>
      initialInput ??
      initialSnapshot?.context ??
      buildIntegrationPlatformContext({ businessId: "", branchId: "" }),
  );
  const [snapshot, setSnapshot] = useState<IntegrationPlatformSnapshot | null>(initialSnapshot ?? null);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setError(null);

    void fetch("/api/integrations?snapshot=true")
      .then(async (response) => {
        const payload = (await response.json()) as {
          success: boolean;
          data?: IntegrationPlatformSnapshot;
          error?: string;
        };

        if (!payload.success || !payload.data) {
          throw new Error(payload.error ?? "Failed to refresh integrations");
        }

        setSnapshot(payload.data);
      })
      .catch((refreshError: unknown) => {
        setError(refreshError instanceof Error ? refreshError.message : "Refresh failed");
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, []);

  const value = useMemo<IntegrationContextValue>(() => {
    const context = snapshot?.context ?? input;
    const record = snapshot?.record ?? {
      integrations: [],
      providers: [],
      apiKeys: [],
      webhooks: [],
      webhookEndpoints: [],
      webhookEvents: [],
      oauthConnections: [],
      externalAccounts: [],
      syncJobs: [],
      mappings: [],
      logs: [],
      apiClients: [],
      apiRequests: [],
      apiResponses: [],
      rateLimits: [],
      apiUsage: [],
      developerApplications: [],
      developerTokens: [],
      developerAnalytics: {
        tenantId: context.tenantId,
        totalApplications: 0,
        activeApiKeys: 0,
        totalRequests: 0,
        errorRateBps: 0,
        averageLatencyMs: 0,
        topEndpoints: [],
        periodStart: "",
        periodEnd: "",
      },
      aiContext: {
        tenantId: context.tenantId,
        summary: "",
        connectedCount: 0,
        failedWebhookCount: 0,
        recommendedProviderId: null,
        insights: [],
        recommendedActions: [],
        lastGeneratedAt: new Date().toISOString(),
      },
    };

    const selectedIntegration = selectedIntegrationId
      ? (record.integrations.find((integration) => integration.id === selectedIntegrationId) ?? null)
      : null;

    return {
      context,
      record,
      selectedIntegrationId,
      selectedIntegration,
      selectIntegration: setSelectedIntegrationId,
      refresh,
      isRefreshing,
      error,
    };
  }, [input, snapshot, selectedIntegrationId, refresh, isRefreshing, error]);

  return <IntegrationContext.Provider value={value}>{children}</IntegrationContext.Provider>;
}
