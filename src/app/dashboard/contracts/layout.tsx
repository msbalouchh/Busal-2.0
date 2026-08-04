import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { ContractsNav } from "@/modules/contracts/components/contracts-nav";

export const metadata: Metadata = {
  title: "Contracts",
};

export default function ContractsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Contract builder, legal clauses, signatures, activation, and renewals."
      nav={<ContractsNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
