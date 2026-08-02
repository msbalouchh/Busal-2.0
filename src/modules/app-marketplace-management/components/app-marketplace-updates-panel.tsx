"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppMarketplaceNav } from "@/modules/app-marketplace-management/components/app-marketplace-nav";
import {
  rollbackAppAction,
  updateAppAction,
} from "@/modules/app-marketplace-management/actions/app-marketplace-actions";
import type { AppMarketplaceContext } from "@/modules/app-marketplace-management/lib/get-app-marketplace-context";
import type { AppUpdateRecord } from "@/modules/app-marketplace-management/types/app-marketplace-types";

interface AppMarketplaceUpdatesPanelProps {
  context: AppMarketplaceContext;
  updates: AppUpdateRecord[];
}

export function AppMarketplaceUpdatesPanel({ context, updates }: AppMarketplaceUpdatesPanelProps) {
  return (
    <div className="space-y-8">
      <AppMarketplaceNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available updates</CardTitle>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <p className="text-muted-foreground text-sm">All apps are up to date.</p>
          ) : (
            <ul className="space-y-3">
              {updates.map((update) => (
                <li
                  key={update.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{update.appName}</p>
                    <p className="text-muted-foreground text-xs">
                      {update.currentVersion} → {update.latestVersion}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {context.permissionsFlags.canUpdate ? (
                      <Button type="button" size="sm" onClick={() => updateAppAction(update.id)}>
                        Update
                      </Button>
                    ) : null}
                    {context.permissionsFlags.canManage ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => rollbackAppAction(update.id)}
                      >
                        Rollback
                      </Button>
                    ) : null}
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
