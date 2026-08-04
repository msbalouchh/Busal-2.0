import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { SettingsEngineNav } from "@/modules/settings-engine/components/settings-engine-nav";

export const metadata: Metadata = {
  title: "Settings & Configuration",
};

export default function SettingsEngineLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Centralized configuration for platform, business, branch, module, and user settings with inheritance, validation, versioning, and audit."
      nav={<SettingsEngineNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
