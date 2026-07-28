import { MarketplaceLists } from "@/modules/marketplace/components/marketplace-lists";
import { getMarketplaceInstalledContext } from "@/modules/marketplace/lib/get-marketplace-context";

export default async function MarketplaceInstalledPage() {
  const { installations } = await getMarketplaceInstalledContext();

  return <MarketplaceLists installations={installations} />;
}
