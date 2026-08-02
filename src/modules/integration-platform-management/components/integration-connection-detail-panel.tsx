"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deleteIntegrationConnectionAction,
  testIntegrationConnectionAction,
  triggerSyncAction,
} from "@/modules/integration-platform-management/actions/integration-platform-actions";
import { IntegrationPlatformNav } from "@/modules/integration-platform-management/components/integration-platform-nav";
import type { IntegrationPlatformContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";
import type {
  IntegrationConnectionRecord,
  IntegrationLogRecord,
} from "@/modules/integration-platform-management/types/integration-platform-types";

interface IntegrationConnectionDetailPanelProps {
  context: IntegrationPlatformContext;
  connection: IntegrationConnectionRecord | null;
  logs: IntegrationLogRecord[];
}

export function IntegrationConnectionDetailPanel({
  context,
  connection,
  logs,
}: IntegrationConnectionDetailPanelProps) {
  const [isPending, startTransition] = useTransition();

  if (!connection) {
    return (
      <div className="space-y-8">
        <IntegrationPlatformNav />
        <p className="text-muted-foreground text-sm">Connection not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <IntegrationPlatformNav />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{connection.displayName}</CardTitle>
          <Badge variant="secondary">{connection.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Provider:</span> {connection.providerName}
          </p>
          <p>
            <span className="text-muted-foreground">Category:</span> {connection.providerCategory}
          </p>
          {connection.lastSyncAt ? (
            <p>
              <span className="text-muted-foreground">Last sync:</span>{" "}
              {new Date(connection.lastSyncAt).toLocaleString()}
            </p>
          ) : null}
          {context.permissionsFlags.canManage ? (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await testIntegrationConnectionAction(connection.id);
                  })
                }
              >
                Test connection
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await triggerSyncAction(connection.id);
                  })
                }
              >
                Sync now
              </Button>
              {context.permissionsFlags.canDelete ? (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteIntegrationConnectionAction(connection.id);
                      window.location.href = "/app/integrations/connections";
                    })
                  }
                >
                  Delete
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connection logs</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No logs for this connection.</p>
          ) : (
            <ul className="space-y-2">
              {logs.map((log) => (
                <li key={log.id} className="text-sm">
                  <Badge variant="outline" className="mr-2">
                    {log.level}
                  </Badge>
                  {log.message}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
