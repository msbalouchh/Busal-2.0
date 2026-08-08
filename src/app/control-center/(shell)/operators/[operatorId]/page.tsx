import { notFound } from "next/navigation";

import { ControlCenterOperatorDetail } from "@/modules/control-center/operators/components/control-center-operator-detail";
import { getControlCenterOperatorDetailContext } from "@/modules/control-center/operators/lib/get-control-center-operators-context";

export const dynamic = "force-dynamic";

interface ControlCenterOperatorDetailPageProps {
  params: Promise<{ operatorId: string }>;
}

export default async function ControlCenterOperatorDetailPage({
  params,
}: ControlCenterOperatorDetailPageProps) {
  const { operatorId } = await params;

  try {
    const bundle = await getControlCenterOperatorDetailContext(operatorId);
    return <ControlCenterOperatorDetail bundle={bundle} />;
  } catch {
    notFound();
  }
}
