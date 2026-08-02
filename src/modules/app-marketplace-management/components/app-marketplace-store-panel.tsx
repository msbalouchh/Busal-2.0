"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppMarketplaceNav } from "@/modules/app-marketplace-management/components/app-marketplace-nav";
import { APP_MARKETPLACE_ROUTES } from "@/modules/app-marketplace-management/constants/routes";
import { installAppAction } from "@/modules/app-marketplace-management/actions/app-marketplace-actions";
import type { AppMarketplaceContext } from "@/modules/app-marketplace-management/lib/get-app-marketplace-context";
import type { MarketplaceAppRecord } from "@/modules/app-marketplace-management/types/app-marketplace-types";

interface AppMarketplaceStorePanelProps {
  context: AppMarketplaceContext;
  apps: MarketplaceAppRecord[];
}

export function AppMarketplaceStorePanel({ context, apps }: AppMarketplaceStorePanelProps) {
  return (
    <div className="space-y-8">
      <AppMarketplaceNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">App Store</CardTitle>
        </CardHeader>
        <CardContent>
          {apps.length === 0 ? (
            <p className="text-muted-foreground text-sm">No apps found.</p>
          ) : (
            <ul className="space-y-3">
              {apps.map((app) => (
                <li
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"
                >
                  <div>
                    <Link
                      href={APP_MARKETPLACE_ROUTES.appDetail(app.id)}
                      className="font-medium hover:underline"
                    >
                      {app.name}
                    </Link>
                    <p className="text-muted-foreground text-xs">{app.developer}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{app.pricingModel}</Badge>
                    {context.permissionsFlags.canInstall ? (
                      <Button type="button" size="sm" onClick={() => installAppAction(app.id)}>
                        Install
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
