import { ControlCenterSupportHub } from "@/modules/control-center/support/components/control-center-support-hub";
import { getControlCenterSupportContext } from "@/modules/control-center/support/lib/get-control-center-support-context";

export const dynamic = "force-dynamic";

interface ControlCenterSupportPageProps {
  searchParams: Promise<{ search?: string; status?: string; priority?: string }>;
}

export default async function ControlCenterSupportPage({
  searchParams,
}: ControlCenterSupportPageProps) {
  const params = await searchParams;
  const bundle = await getControlCenterSupportContext({
    search: params.search,
    status: (params.status as never) ?? undefined,
    priority: (params.priority as never) ?? undefined,
  });

  return <ControlCenterSupportHub bundle={bundle} defaultView="support" />;
}
