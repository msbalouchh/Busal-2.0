import type { Metadata } from "next";

import { CustomerSuccessNav } from "@/modules/customer-success/components/customer-success-nav";

export const metadata: Metadata = {
  title: "Customer Success",
};

export default function CustomerSuccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Customer Success & Account Management
        </h1>
        <p className="text-muted-foreground text-sm">
          Customer 360°, health scores, playbooks, renewals, expansion, and executive reviews.
        </p>
      </div>
      <CustomerSuccessNav />
      {children}
    </div>
  );
}
