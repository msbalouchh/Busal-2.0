import { notFound } from "next/navigation";

import { ControlCenterSectionPlaceholder } from "@/modules/control-center/components/control-center-section-placeholder";
import { CONTROL_CENTER_SECTION_LABELS } from "@/modules/control-center/constants/navigation-items";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";

export const dynamic = "force-dynamic";

interface ControlCenterSectionPageProps {
  params: Promise<{ section: string }>;
}

export default async function ControlCenterSectionPage({ params }: ControlCenterSectionPageProps) {
  const { section } = await params;
  const title = CONTROL_CENTER_SECTION_LABELS[section];

  if (!title) {
    notFound();
  }

  await protectedControlCenterPage();

  return <ControlCenterSectionPlaceholder title={title} />;
}
