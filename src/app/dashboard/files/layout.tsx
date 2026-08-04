import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { FilePlatformNav } from "@/modules/file-platform/components/file-platform-nav";

export const metadata: Metadata = {
  title: "File & Document Management",
};

export default function FilePlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Centralized storage, versioning, permissions, sharing, and audit for all Busal modules."
      nav={<FilePlatformNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
