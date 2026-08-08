import { ControlCenterAiUsageHub } from "@/modules/control-center/ai-usage/components/control-center-ai-usage-hub";
import { getControlCenterAiUsageContext } from "@/modules/control-center/ai-usage/lib/get-control-center-ai-usage-context";

export const dynamic = "force-dynamic";

interface ControlCenterAiUsagePageProps {
  searchParams?: Promise<{
    range?: string;
    section?: string;
    search?: string;
    page?: string;
    compare?: string;
    provider?: string;
    businessId?: string;
    model?: string;
    module?: string;
  }>;
}

export default async function ControlCenterAiUsagePage({
  searchParams,
}: ControlCenterAiUsagePageProps) {
  const params = (await searchParams) ?? {};
  const rangeDays = params.range === "7" || params.range === "90" ? Number(params.range) : 30;
  const page = params.page ? Number(params.page) : 1;

  const bundle = await getControlCenterAiUsageContext({
    rangeDays: rangeDays as 7 | 30 | 90,
    comparePrevious: params.compare !== "false",
    search: params.search,
    section: params.section,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    provider: params.provider,
    businessId: params.businessId,
    model: params.model,
    module: params.module,
  });

  return <ControlCenterAiUsageHub initialBundle={bundle} />;
}
