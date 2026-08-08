import { PlatformIntelligenceHub } from "@/modules/control-center/platform-intelligence/components/platform-intelligence-hub";
import { getPlatformIntelligenceContext } from "@/modules/control-center/platform-intelligence/lib/get-platform-intelligence-context";

export const dynamic = "force-dynamic";

interface ControlCenterIntelligencePageProps {
  searchParams?: Promise<{
    range?: string;
    search?: string;
    drillDown?: string;
    drillDownId?: string;
    page?: string;
    compare?: string;
  }>;
}

function parseRange(value?: string): 7 | 30 | 90 | 365 | "all" {
  if (value === "7" || value === "90" || value === "365") return Number(value) as 7 | 90 | 365;
  if (value === "all") return "all";
  return 30;
}

export default async function ControlCenterIntelligencePage({
  searchParams,
}: ControlCenterIntelligencePageProps) {
  const params = (await searchParams) ?? {};
  const page = params.page ? Number(params.page) : 1;

  const bundle = await getPlatformIntelligenceContext({
    range: parseRange(params.range),
    comparePrevious: params.compare !== "false",
    search: params.search,
    drillDown: params.drillDown as never,
    drillDownId: params.drillDownId,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  return <PlatformIntelligenceHub initialBundle={bundle} />;
}
