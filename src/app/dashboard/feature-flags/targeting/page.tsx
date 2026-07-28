import { FeatureFlagsLists } from "@/modules/feature-flags/components/feature-flags-lists";
import { getFeatureFlagsTargetingContext } from "@/modules/feature-flags/lib/get-feature-flags-context";

export default async function FeatureFlagsTargetingPage() {
  const { targets } = await getFeatureFlagsTargetingContext();
  return <FeatureFlagsLists targets={targets} />;
}
