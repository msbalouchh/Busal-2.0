import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { AiAgentsNav } from "@/modules/ai-agents/components/ai-agents-nav";

export const metadata: Metadata = {
  title: "AI Agents",
};

export default function AiAgentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Create, deploy, and collaborate with AI agents across every Busal module."
      nav={<AiAgentsNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
