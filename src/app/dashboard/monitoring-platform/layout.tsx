import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { MonitoringPlatformNav } from "@/modules/monitoring-platform/components/monitoring-platform-nav";

export const metadata: Metadata = {
  title: "Monitoring & Observability",
};

export default function MonitoringPlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Centralized monitoring for health, performance, reliability, and operational status across every Busal service."
      nav={<MonitoringPlatformNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
