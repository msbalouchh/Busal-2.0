import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { SearchPlatformNav } from "@/modules/search-platform/components/search-platform-nav";

export const metadata: Metadata = {
  title: "Global Search & Indexing",
};

export default function SearchPlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Centralized search service and universal index across every Busal module."
      nav={<SearchPlatformNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
