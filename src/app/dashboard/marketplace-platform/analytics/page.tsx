import type { Metadata } from "next";

import { MarketplaceAnalyticsPanel } from "@/modules/marketplace-platform/components/marketplace-analytics-panel";
import { getMarketplacePlatformAnalyticsContext } from "@/modules/marketplace-platform/lib/get-marketplace-platform-context";

export const metadata: Metadata = {
  title: "Marketplace Analytics",
};

export default async function MarketplacePlatformAnalyticsPage() {
  const { permissions, analytics, widgets, reviews } =
    await getMarketplacePlatformAnalyticsContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Marketplace Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Downloads, active installations, revenue, ratings, reviews, and usage metrics.
        </p>
      </div>
      <MarketplaceAnalyticsPanel
        permissions={permissions}
        analytics={analytics}
        widgets={widgets}
        reviews={reviews}
      />
    </div>
  );
}
