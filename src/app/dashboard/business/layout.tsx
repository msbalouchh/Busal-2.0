import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { BusinessNav } from "@/modules/business/components/business-nav";

interface BusinessLayoutProps {
  children: ReactNode;
}

export default function BusinessLayout({ children }: BusinessLayoutProps) {
  return (
    <DashboardSectionLayout
      description="Business profile, settings, and organizational configuration."
      nav={<BusinessNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
