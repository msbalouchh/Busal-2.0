import type { Metadata } from "next";

import { CrmNav } from "@/modules/crm/components/crm-nav";

export const metadata: Metadata = {
  title: "CRM",
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Customer CRM</h1>
        <p className="text-muted-foreground text-sm">
          Manage customers, loyalty, rewards, and customer groups.
        </p>
      </div>
      <CrmNav />
      {children}
    </div>
  );
}
