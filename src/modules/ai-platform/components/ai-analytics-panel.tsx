import type {
  AiAnalyticsSnapshot,
  AiDashboardWidgets,
  AiPlatformPermissions,
} from "@/modules/ai-platform/types/ai-platform-types";

interface AiAnalyticsPanelProps {
  permissions: AiPlatformPermissions;
  analytics: AiAnalyticsSnapshot | null;
  widgets: AiDashboardWidgets;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function AiAnalyticsPanel({ permissions, analytics, widgets }: AiAnalyticsPanelProps) {
  if (!permissions.canViewAnalytics || !analytics) {
    return (
      <p className="text-muted-foreground text-sm">
        You do not have permission to view AI analytics.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total tokens</p>
          <p className="text-2xl font-semibold">{analytics.totalTokensUsed.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Estimated cost</p>
          <p className="text-2xl font-semibold">£{(analytics.totalCostCents / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Avg response time</p>
          <p className="text-2xl font-semibold">{analytics.averageResponseTimeMs}ms</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Success rate</p>
          <p className="text-2xl font-semibold">{formatPercent(analytics.successRate)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Error rate</p>
          <p className="text-2xl font-semibold">{formatPercent(analytics.errorRate)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Tool tokens</p>
          <p className="text-2xl font-semibold">{analytics.toolTokensUsed.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Agent tokens</p>
          <p className="text-2xl font-semibold">{analytics.agentTokensUsed.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Automation tokens</p>
          <p className="text-2xl font-semibold">
            {analytics.automationTokensUsed.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Model usage</h2>
          {analytics.modelUsage.length === 0 ? (
            <p className="text-muted-foreground text-sm">No model usage recorded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {analytics.modelUsage.map((entry) => (
                <li key={entry.model} className="flex items-center justify-between gap-3">
                  <span className="font-medium">{entry.model}</span>
                  <span className="text-muted-foreground">
                    {entry.count} runs · {entry.tokens.toLocaleString()} tokens
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Platform health</h2>
          <ul className="space-y-2 text-sm">
            <li>AI health score: {formatPercent(widgets.healthScore)}</li>
            <li>Automation success: {formatPercent(widgets.automationSuccessRate)}</li>
            <li>Tool executions: {widgets.toolExecutions.toLocaleString()}</li>
            <li>Knowledge searches: {widgets.knowledgeSearches.toLocaleString()}</li>
          </ul>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Recent errors</h2>
        {analytics.recentErrors.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recent AI errors.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {analytics.recentErrors.map((error) => (
              <li key={error.id}>
                <span className="font-medium">{error.source}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {error.message} · {new Date(error.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
