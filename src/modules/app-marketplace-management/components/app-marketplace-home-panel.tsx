"use client";

import Link from "next/link";
import { Package, Download, RefreshCw, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppMarketplaceNav } from "@/modules/app-marketplace-management/components/app-marketplace-nav";
import { APP_MARKETPLACE_ROUTES } from "@/modules/app-marketplace-management/constants/routes";
import type { AppMarketplaceContext } from "@/modules/app-marketplace-management/lib/get-app-marketplace-context";
import type {
  MarketplaceAppRecord,
  MarketplaceSummaryRecord,
} from "@/modules/app-marketplace-management/types/app-marketplace-types";

interface AppMarketplaceHomePanelProps {
  context: AppMarketplaceContext;
  summary: MarketplaceSummaryRecord;
  featuredApps: MarketplaceAppRecord[];
}

export function AppMarketplaceHomePanel({
  context,
  summary,
  featuredApps,
}: AppMarketplaceHomePanelProps) {
  const cards = [
    { label: "Available Apps", value: summary.totalApps, icon: Package },
    { label: "Installed", value: summary.installed, icon: Download },
    { label: "Updates", value: summary.pendingUpdates, icon: RefreshCw },
    { label: "Categories", value: summary.categories.length, icon: Star },
  ];

  return (
    <div className="space-y-8">
      <AppMarketplaceNav />
      <p className="text-muted-foreground text-sm">
        App marketplace for {context.business.businessName ?? "your business"}.
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
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Featured apps</CardTitle>
          <Link
            href={APP_MARKETPLACE_ROUTES.store()}
            className="text-primary text-sm hover:underline"
          >
            Browse store
          </Link>
        </CardHeader>
        <CardContent>
          {featuredApps.length === 0 ? (
            <p className="text-muted-foreground text-sm">No apps available yet.</p>
          ) : (
            <ul className="space-y-3">
              {featuredApps.map((app) => (
                <li key={app.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={APP_MARKETPLACE_ROUTES.appDetail(app.id)}
                    className="font-medium hover:underline"
                  >
                    {app.name}
                  </Link>
                  <Badge variant="secondary">{app.category}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
