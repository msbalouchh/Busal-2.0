"use client";

import { IntegrationCategoryBadge } from "@/modules/integrations/components/integration-category-badge";
import { IntegrationManagementEmpty } from "@/modules/integrations/components/integration-management-empty";
import { IntegrationManagementError } from "@/modules/integrations/components/integration-management-error";
import { IntegrationManagementLoading } from "@/modules/integrations/components/integration-management-loading";
import { IntegrationStatusBadge } from "@/modules/integrations/components/integration-status-badge";
import { useIntegrations } from "@/modules/integrations/hooks/use-integrations";

export function IntegrationPlatformOverview() {
  const { record, refresh, isRefreshing, error } = useIntegrations();

  if (isRefreshing && record.integrations.length === 0 && record.providers.length === 0) {
    return <IntegrationManagementLoading />;
  }

  if (error && record.integrations.length === 0 && record.providers.length === 0) {
    return <IntegrationManagementError message={error} onRetry={refresh} />;
  }

  if (record.integrations.length === 0 && record.providers.length === 0) {
    return <IntegrationManagementEmpty />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Connected</p>
          <p className="text-2xl font-semibold">
            {record.integrations.filter((integration) => integration.status === "connected").length}
          </p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">API Keys</p>
          <p className="text-2xl font-semibold">{record.apiKeys.length}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Webhooks</p>
          <p className="text-2xl font-semibold">{record.webhooks.length}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">API Requests</p>
          <p className="text-2xl font-semibold">{record.developerAnalytics.totalRequests}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Connected Integrations</h3>
          <button type="button" className="text-primary text-sm font-medium" onClick={refresh} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="space-y-3">
          {record.integrations.slice(0, 10).map((integration) => (
            <div key={integration.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div>
                <p className="font-medium">{integration.name}</p>
                <p className="text-muted-foreground text-sm">Last sync: {integration.lastSyncAt ?? "Never"}</p>
              </div>
              <div className="flex items-center gap-2">
                <IntegrationCategoryBadge category={integration.category} />
                <IntegrationStatusBadge status={integration.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
