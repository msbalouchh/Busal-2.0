import { FeatureFlagsLists } from "@/modules/feature-flags/components/feature-flags-lists";
import { getFeatureFlagsAuditContext } from "@/modules/feature-flags/lib/get-feature-flags-context";

export default async function FeatureFlagsAuditPage() {
  const { auditLogs } = await getFeatureFlagsAuditContext();
  return <FeatureFlagsLists auditLogs={auditLogs} />;
}
