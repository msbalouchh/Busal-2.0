import { ControlCenterPlatformAutomationHub } from "@/modules/control-center/automation/components/control-center-platform-automation-hub";
import { getControlCenterPlatformAutomationContext } from "@/modules/control-center/automation/lib/get-control-center-platform-automation-context";

export const dynamic = "force-dynamic";

interface ControlCenterAutomationPageProps {
  searchParams?: Promise<{
    search?: string;
    category?: string;
    status?: string;
    trigger?: string;
    priority?: string;
    page?: string;
  }>;
}

export default async function ControlCenterAutomationPage({
  searchParams,
}: ControlCenterAutomationPageProps) {
  const params = (await searchParams) ?? {};
  const page = params.page ? Number(params.page) : 1;

  const bundle = await getControlCenterPlatformAutomationContext({
    search: params.search,
    category: params.category as never,
    status: params.status as never,
    trigger: params.trigger as never,
    priority: params.priority as never,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  return <ControlCenterPlatformAutomationHub initialBundle={bundle} />;
}
