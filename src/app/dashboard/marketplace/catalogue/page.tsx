import { MarketplaceLists } from "@/modules/marketplace/components/marketplace-lists";
import { getMarketplaceCatalogueContext } from "@/modules/marketplace/lib/get-marketplace-context";

export default async function MarketplaceCataloguePage() {
  const { items } = await getMarketplaceCatalogueContext();

  return <MarketplaceLists items={items} />;
}
