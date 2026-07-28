import { MarketplaceLists } from "@/modules/marketplace/components/marketplace-lists";
import { getMarketplaceRevenueContext } from "@/modules/marketplace/lib/get-marketplace-context";

export default async function MarketplaceRevenuePage() {
  const { records } = await getMarketplaceRevenueContext();

  return <MarketplaceLists revenue={records} />;
}
