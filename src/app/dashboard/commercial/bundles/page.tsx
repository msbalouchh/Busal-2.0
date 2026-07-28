import { CommercialBundlesList } from "@/modules/commercial/components/commercial-lists";
import { getCommercialBundlesContext } from "@/modules/commercial/lib/get-commercial-context";

export default async function CommercialBundlesPage() {
  const { bundles } = await getCommercialBundlesContext();

  return <CommercialBundlesList bundles={bundles} />;
}
