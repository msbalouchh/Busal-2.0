import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { QuotesNav } from "@/modules/quotes/components/quotes-nav";

export const metadata: Metadata = {
  title: "Quotes & Proposals",
};

export default function QuotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Quote builder, pricing engine, proposal templates, and client delivery."
      nav={<QuotesNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
