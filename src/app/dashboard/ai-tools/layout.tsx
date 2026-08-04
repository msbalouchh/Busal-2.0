import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { AiToolsNav } from "@/modules/ai-tools/components/ai-tools-nav";

export const metadata: Metadata = {
  title: "Busal AI Tools",
};

export default function AiToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Tool registry, execution engine, discovery, and safety controls for AI agents."
      nav={<AiToolsNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
