"use client";

import Link from "next/link";
import { Link2, Plug, RefreshCw, Webhook } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationPlatformNav } from "@/modules/integration-platform-management/components/integration-platform-nav";
import { INTEGRATION_PLATFORM_ROUTES } from "@/modules/integration-platform-management/constants/routes";
import type { IntegrationPlatformContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";
import type {
  IntegrationConnectionRecord,
  IntegrationLogRecord,
  IntegrationProviderRecord,
  IntegrationSyncJobRecord,
  IntegrationWebhookRecord,
} from "@/modules/integration-platform-management/types/integration-platform-types";
import type { IntegrationHealthSnapshot } from "@/services/integration-health-monitor.service";

interface IntegrationDashboardPanelProps {
  context: IntegrationPlatformContext;
  health: IntegrationHealthSnapshot;
  providers: IntegrationProviderRecord[];
  connections: IntegrationConnectionRecord[];
  webhooks: IntegrationWebhookRecord[];
  syncJobs: IntegrationSyncJobRecord[];
  logs: IntegrationLogRecord[];
}

export function IntegrationDashboardPanel({
  context,
  health,
  providers,
  connections,
  webhooks: _webhooks,
  syncJobs: _syncJobs,
  logs,
}: IntegrationDashboardPanelProps) {
  const cards = [
    {
      label: "Health score",
      value: `${health.healthScore}%`,
      sub: health.healthLabel,
      icon: Plug,
    },
    {
      label: "Providers",
      value: health.totalProviders,
      sub: `${health.activeConnections} active connections`,
      icon: Link2,
    },
    {
      label: "Webhooks",
      value: health.activeWebhooks,
      sub: `${health.pendingSyncJobs} pending syncs`,
      icon: Webhook,
    },
    {
      label: "Failed syncs",
      value: health.failedSyncJobs,
      sub: `${health.recentErrors} errors (24h)`,
      icon: RefreshCw,
    },
  ];

  return (
    <div className="space-y-8">
      <IntegrationPlatformNav />

      <p className="text-muted-foreground text-sm">
        Integration platform for {context.business.businessName ?? "your business"}.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="text-muted-foreground h-4 w-4" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{card.value}</p>
              <p className="text-muted-foreground text-xs">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Connected apps</CardTitle>
            <Link
              href={INTEGRATION_PLATFORM_ROUTES.connections()}
              className="text-primary text-sm hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {connections.length === 0 ? (
              <p className="text-muted-foreground text-sm">No connections yet.</p>
            ) : (
              <ul className="space-y-3">
                {connections.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <Link
                      href={INTEGRATION_PLATFORM_ROUTES.connectionDetail(item.id)}
                      className="font-medium hover:underline"
                    >
                      {item.displayName}
                    </Link>
                    <Badge variant="secondary">{item.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent logs</CardTitle>
            <Link
              href={INTEGRATION_PLATFORM_ROUTES.logs()}
              className="text-primary text-sm hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No logs yet.</p>
            ) : (
              <ul className="space-y-2">
                {logs.map((log) => (
                  <li key={log.id} className="text-sm">
                    <span className="font-medium">{log.level}</span>
                    <span className="text-muted-foreground"> — {log.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available providers ({providers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {providers.slice(0, 8).map((provider) => (
              <li key={provider.id} className="rounded border p-3 text-sm">
                <p className="font-medium">{provider.name}</p>
                <p className="text-muted-foreground text-xs">{provider.category}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
