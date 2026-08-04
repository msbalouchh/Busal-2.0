import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { BackupPlatformNav } from "@/modules/backup-platform/components/backup-platform-nav";

export const metadata: Metadata = {
  title: "Backup & Disaster Recovery",
};

export default function BackupPlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Centralized backup, point-in-time recovery, and disaster recovery for all Busal services."
      nav={<BackupPlatformNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
