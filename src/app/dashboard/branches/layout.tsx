import type { Metadata } from "next";

import { BranchNav } from "@/modules/branches/components/branch-nav";

export const metadata: Metadata = {
  title: "Branches",
};

export default function BranchesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Multi-Branch Management</h1>
        <p className="text-muted-foreground text-sm">
          Central dashboard, branch performance, and branch switching.
        </p>
      </div>
      <BranchNav />
      {children}
    </div>
  );
}
