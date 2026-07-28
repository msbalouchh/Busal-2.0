import type { Metadata } from "next";

import { SalesCrmNav } from "@/modules/sales-crm/components/sales-crm-nav";

export const metadata: Metadata = {
  title: "Sales CRM",
};

export default function SalesCrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sales CRM & Pipeline</h1>
        <p className="text-muted-foreground text-sm">
          Leads, opportunities, pipeline stages, and commercial catalogue links.
        </p>
      </div>
      <SalesCrmNav />
      {children}
    </div>
  );
}
