import { FeatureFlagsDashboard } from "@/modules/feature-flags/components/feature-flags-dashboard";
import { getFeatureFlagsOverviewContext } from "@/modules/feature-flags/lib/get-feature-flags-context";

export default async function FeatureFlagsOverviewPage() {
  const { dashboard } = await getFeatureFlagsOverviewContext();
  return <FeatureFlagsDashboard dashboard={dashboard} />;
}
