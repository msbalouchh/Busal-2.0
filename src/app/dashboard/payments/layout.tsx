import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";

export const metadata: Metadata = {
  title: "Payments",
};

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout description="Complete POS orders with cash, card, split, or partial payments.">
      {children}
    </DashboardSectionLayout>
  );
}
