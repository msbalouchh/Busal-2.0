import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { ImportExportPlatformNav } from "@/modules/import-export-platform/components/import-export-platform-nav";

export const metadata: Metadata = {
  title: "Data Import & Export",
};

export default function ImportExportPlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Centralized import and export for CSV, Excel, JSON, and PDF across all Busal OS modules."
      nav={<ImportExportPlatformNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
