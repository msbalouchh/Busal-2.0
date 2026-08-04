import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { AiPlatformNav } from "@/modules/ai-platform/components/ai-platform-nav";

interface AiPlatformLayoutProps {
  children: ReactNode;
}

export default function AiPlatformLayout({ children }: AiPlatformLayoutProps) {
  return (
    <DashboardSectionLayout
      description="AI agents, analytics, and automation for your workspace."
      nav={<AiPlatformNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
