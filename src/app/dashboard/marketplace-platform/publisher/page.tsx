import type { Metadata } from "next";

import { MarketplacePublisherPanel } from "@/modules/marketplace-platform/components/marketplace-publisher-panel";
import { getMarketplacePlatformPublisherContext } from "@/modules/marketplace-platform/lib/get-marketplace-platform-context";

export const metadata: Metadata = {
  title: "Publisher Portal",
};

export default async function MarketplacePlatformPublisherPage() {
  const { permissions, portal } = await getMarketplacePlatformPublisherContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Publisher Portal</h1>
        <p className="text-muted-foreground text-sm">
          Manage published apps, plugins, agents, versions, downloads, revenue, and reviews.
        </p>
      </div>
      <MarketplacePublisherPanel permissions={permissions} portal={portal} />
    </div>
  );
}
