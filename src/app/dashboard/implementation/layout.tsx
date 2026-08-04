import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { ImplementationNav } from "@/modules/implementation/components/implementation-nav";

export const metadata: Metadata = {
  title: "Implementation",
};

export default function ImplementationLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Implementation projects, templates, milestones, go-live, and hypercare."
      nav={<ImplementationNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
