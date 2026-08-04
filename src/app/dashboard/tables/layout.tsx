import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";

interface TablesLayoutProps {
  children: ReactNode;
}

export default function TablesLayout({ children }: TablesLayoutProps) {
  return (
    <DashboardSectionLayout description="Manage table layouts, sections, and seating capacity.">
      {children}
    </DashboardSectionLayout>
  );
}
