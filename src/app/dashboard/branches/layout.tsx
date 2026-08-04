import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { BranchNav } from "@/modules/branches/components/branch-nav";

export const metadata: Metadata = {
  title: "Branches",
};

export default function BranchesLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Central dashboard, branch performance, and branch switching."
      nav={<BranchNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
