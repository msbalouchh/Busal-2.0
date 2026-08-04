import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { CommunicationNav } from "@/modules/communication/components/communication-nav";

export const metadata: Metadata = {
  title: "Communication Center",
};

export default function CommunicationLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Unified omnichannel inbox with conversations, timeline, assignment, and AI assistance."
      nav={<CommunicationNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
