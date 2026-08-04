import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { LocalizationPlatformNav } from "@/modules/localization-platform/components/localization-platform-nav";

export const metadata: Metadata = {
  title: "Multi-language & Localization",
};

export default function LocalizationPlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Centralized localization for languages, translations, regional settings, and formatting across Busal OS."
      nav={<LocalizationPlatformNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
