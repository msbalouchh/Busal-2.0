import { MarketplaceLists } from "@/modules/marketplace/components/marketplace-lists";
import { getMarketplaceReviewsContext } from "@/modules/marketplace/lib/get-marketplace-context";

export default async function MarketplaceReviewsPage() {
  const { reviews } = await getMarketplaceReviewsContext();

  return <MarketplaceLists reviews={reviews} />;
}
