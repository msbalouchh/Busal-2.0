import { FeatureFlagsLists } from "@/modules/feature-flags/components/feature-flags-lists";
import { getFeatureFlagsRegistryContext } from "@/modules/feature-flags/lib/get-feature-flags-context";

export default async function FeatureFlagsRegistryPage() {
  const { registrations } = await getFeatureFlagsRegistryContext();
  return <FeatureFlagsLists registrations={registrations} />;
}
