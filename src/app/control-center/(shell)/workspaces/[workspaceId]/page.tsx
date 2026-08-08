import { notFound } from "next/navigation";

import { ControlCenterWorkspaceDetail } from "@/modules/control-center/workspaces/components/control-center-workspace-detail";
import { getControlCenterWorkspaceDetailContext } from "@/modules/control-center/workspaces/lib/get-control-center-workspaces-context";

export const dynamic = "force-dynamic";

interface ControlCenterWorkspaceDetailPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function ControlCenterWorkspaceDetailPage({
  params,
}: ControlCenterWorkspaceDetailPageProps) {
  const { workspaceId } = await params;

  try {
    const bundle = await getControlCenterWorkspaceDetailContext(workspaceId);
    return <ControlCenterWorkspaceDetail bundle={bundle} />;
  } catch {
    notFound();
  }
}
