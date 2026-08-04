import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";

export const metadata: Metadata = {
  title: "Receipts",
};

export default function ReceiptsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout description="View, print, and manage customer receipts.">
      {children}
    </DashboardSectionLayout>
  );
}
