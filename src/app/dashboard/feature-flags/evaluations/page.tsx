import { FeatureFlagsLists } from "@/modules/feature-flags/components/feature-flags-lists";
import { getFeatureFlagsEvaluationsContext } from "@/modules/feature-flags/lib/get-feature-flags-context";

export default async function FeatureFlagsEvaluationsPage() {
  const { evaluations } = await getFeatureFlagsEvaluationsContext();
  return <FeatureFlagsLists evaluations={evaluations} />;
}
