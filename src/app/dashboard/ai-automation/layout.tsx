import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { AiAutomationNav } from "@/modules/ai-automation/components/ai-automation-nav";

export const metadata: Metadata = {
  title: "AI Automation",
};

export default function AiAutomationLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Event-driven workflows with AI decisions, approvals, actions, and monitoring."
      nav={<AiAutomationNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
