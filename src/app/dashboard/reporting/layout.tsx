import type { Metadata } from "next";

import { ReportingNav } from "@/modules/reporting/components/reporting-nav";

export const metadata: Metadata = {
  title: "Reporting & Analytics",
};

export default function ReportingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Reporting & Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Sales, orders, products, customers, inventory, staff, and financial reports.
        </p>
      </div>
      <ReportingNav />
      {children}
    </div>
  );
}
