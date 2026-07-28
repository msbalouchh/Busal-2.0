import { RevenueAnalyticsView } from "@/modules/revops/components/revops-lists";
import { getRevopsAnalyticsContext } from "@/modules/revops/lib/get-revops-context";

export default async function RevopsAnalyticsPage() {
  const { analytics } = await getRevopsAnalyticsContext();

  return <RevenueAnalyticsView analytics={analytics} />;
}
