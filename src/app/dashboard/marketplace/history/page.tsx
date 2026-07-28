import { MarketplaceLists } from "@/modules/marketplace/components/marketplace-lists";
import { getMarketplaceHistoryContext } from "@/modules/marketplace/lib/get-marketplace-context";

export default async function MarketplaceHistoryPage() {
  const { history } = await getMarketplaceHistoryContext();

  return <MarketplaceLists history={history} />;
}
