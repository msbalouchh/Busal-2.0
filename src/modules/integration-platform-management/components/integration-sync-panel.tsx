"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { retryFailedSyncsAction } from "@/modules/integration-platform-management/actions/integration-platform-actions";
import { IntegrationPlatformNav } from "@/modules/integration-platform-management/components/integration-platform-nav";
import type { IntegrationPlatformContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";
import type { IntegrationSyncJobRecord } from "@/modules/integration-platform-management/types/integration-platform-types";

interface IntegrationSyncPanelProps {
  context: IntegrationPlatformContext;
  syncJobs: IntegrationSyncJobRecord[];
}

export function IntegrationSyncPanel({ context, syncJobs }: IntegrationSyncPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <IntegrationPlatformNav />

      {context.permissionsFlags.canManage ? (
        <Button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await retryFailedSyncsAction();
            })
          }
        >
          {isPending ? "Retrying…" : "Retry failed syncs"}
        </Button>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync monitor ({syncJobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {syncJobs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sync jobs yet.</p>
          ) : (
            <ul className="space-y-3">
              {syncJobs.map((job) => (
                <li key={job.id} className="rounded border p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{job.connectionName}</p>
                      <p className="text-muted-foreground">{job.providerName}</p>
                    </div>
                    <Badge variant="secondary">{job.status}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Attempts: {job.attempts}/{job.maxAttempts}
                  </p>
                  {job.errorMessage ? (
                    <p className="text-destructive mt-1">{job.errorMessage}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
