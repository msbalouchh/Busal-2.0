import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { FeatureFlagsNav } from "@/modules/feature-flags/components/feature-flags-nav";

export const metadata: Metadata = {
  title: "Feature Flag Management",
};

export default function FeatureFlagsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Centralized feature flag service controlling feature availability across Busal OS."
      nav={<FeatureFlagsNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
