"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppMarketplaceNav } from "@/modules/app-marketplace-management/components/app-marketplace-nav";
import { APP_MARKETPLACE_ROUTES } from "@/modules/app-marketplace-management/constants/routes";
import {
  disableAppAction,
  enableAppAction,
  uninstallAppAction,
} from "@/modules/app-marketplace-management/actions/app-marketplace-actions";
import type { AppMarketplaceContext } from "@/modules/app-marketplace-management/lib/get-app-marketplace-context";
import type { InstalledAppRecord } from "@/modules/app-marketplace-management/types/app-marketplace-types";

interface AppMarketplaceInstalledPanelProps {
  context: AppMarketplaceContext;
  installed: InstalledAppRecord[];
}

export function AppMarketplaceInstalledPanel({
  context,
  installed,
}: AppMarketplaceInstalledPanelProps) {
  return (
    <div className="space-y-8">
      <AppMarketplaceNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Installed apps</CardTitle>
        </CardHeader>
        <CardContent>
          {installed.length === 0 ? (
            <p className="text-muted-foreground text-sm">No apps installed yet.</p>
          ) : (
            <ul className="space-y-3">
              {installed.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{entry.appName}</p>
                    <p className="text-muted-foreground text-xs">v{entry.version}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{entry.status}</Badge>
                    <Link
                      href={APP_MARKETPLACE_ROUTES.settings(entry.id)}
                      className="text-primary text-xs hover:underline"
                    >
                      Settings
                    </Link>
                    {context.permissionsFlags.canUpdate ? (
                      entry.status === "DISABLED" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => enableAppAction(entry.id)}
                        >
                          Enable
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => disableAppAction(entry.id)}
                        >
                          Disable
                        </Button>
                      )
                    ) : null}
                    {context.permissionsFlags.canDelete ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => uninstallAppAction(entry.id)}
                      >
                        Uninstall
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
