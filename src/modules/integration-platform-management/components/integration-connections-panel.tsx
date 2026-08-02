"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationPlatformNav } from "@/modules/integration-platform-management/components/integration-platform-nav";
import { INTEGRATION_PLATFORM_ROUTES } from "@/modules/integration-platform-management/constants/routes";
import type { IntegrationPlatformContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";
import type { IntegrationConnectionRecord } from "@/modules/integration-platform-management/types/integration-platform-types";

interface IntegrationConnectionsPanelProps {
  context: IntegrationPlatformContext;
  connections: IntegrationConnectionRecord[];
}

export function IntegrationConnectionsPanel({
  context,
  connections,
}: IntegrationConnectionsPanelProps) {
  return (
    <div className="space-y-8">
      <IntegrationPlatformNav />

      <div className="flex flex-wrap justify-end gap-2">
        {context.permissionsFlags.canCreate ? (
          <Button asChild>
            <Link href={INTEGRATION_PLATFORM_ROUTES.connectionNew()}>New connection</Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected apps ({connections.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <p className="text-muted-foreground text-sm">No connected apps yet.</p>
          ) : (
            <ul className="space-y-3">
              {connections.map((connection) => (
                <li key={connection.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        href={INTEGRATION_PLATFORM_ROUTES.connectionDetail(connection.id)}
                        className="font-medium hover:underline"
                      >
                        {connection.displayName}
                      </Link>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {connection.providerName} · {connection.providerCategory}
                      </p>
                      {connection.lastSyncAt ? (
                        <p className="text-muted-foreground mt-1 text-xs">
                          Last sync: {new Date(connection.lastSyncAt).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="secondary">{connection.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
