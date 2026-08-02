"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationPlatformNav } from "@/modules/integration-platform-management/components/integration-platform-nav";
import type { IntegrationHealthSnapshot } from "@/services/integration-health-monitor.service";

interface IntegrationHealthPanelProps {
  health: IntegrationHealthSnapshot;
}

export function IntegrationHealthPanel({ health }: IntegrationHealthPanelProps) {
  return (
    <div className="space-y-8">
      <IntegrationPlatformNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Health score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{health.healthScore}%</p>
            <p className="text-muted-foreground text-xs">{health.healthLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active connections</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{health.activeConnections}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Error connections</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{health.errorConnections}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent errors (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{health.recentErrors}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Health details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Providers: {health.totalProviders}</p>
          <p>Disconnected: {health.disconnectedConnections}</p>
          <p>Active webhooks: {health.activeWebhooks}</p>
          <p>Pending sync jobs: {health.pendingSyncJobs}</p>
          <p>Failed sync jobs: {health.failedSyncJobs}</p>
        </CardContent>
      </Card>
    </div>
  );
}
