import type { Metadata } from "next";

import { RevopsNav } from "@/modules/revops/components/revops-nav";

export const metadata: Metadata = {
  title: "Revenue Operations",
};

export default function RevopsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Revenue Operations</h1>
        <p className="text-muted-foreground text-sm">
          Invoices, payments, recognition, profitability, forecasting, and collections.
        </p>
      </div>
      <RevopsNav />
      {children}
    </div>
  );
}
