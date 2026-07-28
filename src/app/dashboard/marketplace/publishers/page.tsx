import { MarketplaceLists } from "@/modules/marketplace/components/marketplace-lists";
import { getMarketplacePublishersContext } from "@/modules/marketplace/lib/get-marketplace-context";

export default async function MarketplacePublishersPage() {
  const { publishers } = await getMarketplacePublishersContext();

  return <MarketplaceLists publishers={publishers} />;
}
