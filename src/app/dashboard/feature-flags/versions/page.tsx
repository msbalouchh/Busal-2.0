import { FeatureFlagsLists } from "@/modules/feature-flags/components/feature-flags-lists";
import { getFeatureFlagsVersionsContext } from "@/modules/feature-flags/lib/get-feature-flags-context";

export default async function FeatureFlagsVersionsPage() {
  const { versions } = await getFeatureFlagsVersionsContext();
  return <FeatureFlagsLists versions={versions} />;
}
