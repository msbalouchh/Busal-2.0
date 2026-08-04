import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { IamNav } from "@/modules/iam/components/iam-nav";

export const metadata: Metadata = {
  title: "Identity & Access Management",
};

export default function IamLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Centralized authentication, authorization, sessions, API keys, and security policies."
      nav={<IamNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
