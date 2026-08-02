import type { Metadata } from "next";

import { MarketplaceCatalogPanel } from "@/modules/marketplace-platform/components/marketplace-catalog-panel";
import { getMarketplacePlatformCatalogContext } from "@/modules/marketplace-platform/lib/get-marketplace-platform-context";

export const metadata: Metadata = {
  title: "Marketplace Catalog",
};

export default async function MarketplacePlatformCatalogPage() {
  const { catalog } = await getMarketplacePlatformCatalogContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Marketplace Catalog</h1>
        <p className="text-muted-foreground text-sm">
          Search, filter, and browse apps, agents, themes, plugins, and packs.
        </p>
      </div>
      <MarketplaceCatalogPanel initialCatalog={catalog} />
    </div>
  );
}
