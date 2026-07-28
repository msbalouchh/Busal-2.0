import { FeatureFlagsLists } from "@/modules/feature-flags/components/feature-flags-lists";
import { getFeatureFlagsListContext } from "@/modules/feature-flags/lib/get-feature-flags-context";

export default async function FeatureFlagsListPage() {
  const { flags } = await getFeatureFlagsListContext();
  return <FeatureFlagsLists flags={flags} />;
}
