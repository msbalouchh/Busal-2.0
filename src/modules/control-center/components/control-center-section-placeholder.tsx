"use client";

import { Construction } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";

interface ControlCenterSectionPlaceholderProps {
  title: string;
  description?: string;
}

export function ControlCenterSectionPlaceholder({
  title,
  description = "This Control Center module is registered and ready for future implementation.",
}: ControlCenterSectionPlaceholderProps) {
  return (
    <PageContainer>
      <SectionHeader title={title} description={description} />
      <ControlCenterEmptyState
        title={`${title} module`}
        description="Integrate module-specific workflows here without modifying the dashboard foundation."
        icon={<Construction className="text-muted-foreground h-6 w-6" aria-hidden="true" />}
      />
    </PageContainer>
  );
}
