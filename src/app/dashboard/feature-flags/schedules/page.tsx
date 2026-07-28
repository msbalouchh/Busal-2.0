import { FeatureFlagsLists } from "@/modules/feature-flags/components/feature-flags-lists";
import { getFeatureFlagsSchedulesContext } from "@/modules/feature-flags/lib/get-feature-flags-context";

export default async function FeatureFlagsSchedulesPage() {
  const { flags } = await getFeatureFlagsSchedulesContext();
  return <FeatureFlagsLists flags={flags} />;
}
