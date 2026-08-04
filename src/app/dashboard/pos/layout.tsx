import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";

export const metadata: Metadata = {
  title: "Point of Sale",
};

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout description="Take orders, apply payments, and manage the service flow.">
      {children}
    </DashboardSectionLayout>
  );
}
