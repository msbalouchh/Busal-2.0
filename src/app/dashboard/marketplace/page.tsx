import { MarketplaceDashboard } from "@/modules/marketplace/components/marketplace-dashboard";
import { getMarketplaceOverviewContext } from "@/modules/marketplace/lib/get-marketplace-context";

export default async function MarketplaceOverviewPage() {
  const { dashboard } = await getMarketplaceOverviewContext();

  return <MarketplaceDashboard dashboard={dashboard} />;
}
