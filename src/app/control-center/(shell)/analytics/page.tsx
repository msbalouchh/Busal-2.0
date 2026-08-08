import { ControlCenterPlatformAnalyticsHub } from "@/modules/control-center/analytics/components/control-center-platform-analytics-hub";
import { getControlCenterPlatformAnalyticsContext } from "@/modules/control-center/analytics/lib/get-control-center-platform-analytics-context";

export const dynamic = "force-dynamic";

interface ControlCenterAnalyticsPageProps {
  searchParams?: Promise<{
    range?: string;
    section?: string;
    search?: string;
    page?: string;
    compare?: string;
  }>;
}

export default async function ControlCenterAnalyticsPage({
  searchParams,
}: ControlCenterAnalyticsPageProps) {
  const params = (await searchParams) ?? {};
  const rangeDays = params.range === "7" || params.range === "90" ? Number(params.range) : 30;
  const page = params.page ? Number(params.page) : 1;

  const bundle = await getControlCenterPlatformAnalyticsContext({
    rangeDays: rangeDays as 7 | 30 | 90,
    comparePrevious: params.compare !== "false",
    search: params.search,
    section: params.section,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  return <ControlCenterPlatformAnalyticsHub initialBundle={bundle} />;
}
