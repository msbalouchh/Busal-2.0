import type { Metadata } from "next";

import { MarketplacePlatformOverview } from "@/modules/marketplace-platform/components/marketplace-platform-overview";
import { getMarketplacePlatformContext } from "@/modules/marketplace-platform/lib/get-marketplace-platform-context";

export const metadata: Metadata = {
  title: "Marketplace Platform",
};

export default async function MarketplacePlatformPage() {
  const {
    widgets,
    permissions,
    homeSections,
    recentlyInstalled,
    recommended,
    registeredExtensionCount,
  } = await getMarketplacePlatformContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Marketplace Platform</h1>
        <p className="text-muted-foreground text-sm">
          Apps, AI agents, themes, plugins, packs, installations, licenses, and publisher tools.
        </p>
      </div>
      <MarketplacePlatformOverview
        widgets={widgets}
        permissions={permissions}
        homeSections={homeSections}
        recentlyInstalled={recentlyInstalled}
        recommended={recommended}
        registeredExtensionCount={registeredExtensionCount}
      />
    </div>
  );
}
