import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";

interface KitchenLayoutProps {
  children: ReactNode;
}

export default function KitchenLayout({ children }: KitchenLayoutProps) {
  return (
    <DashboardSectionLayout description="Kitchen display, order routing, and prep station management.">
      {children}
    </DashboardSectionLayout>
  );
}
