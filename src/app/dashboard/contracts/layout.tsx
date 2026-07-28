import type { Metadata } from "next";

import { ContractsNav } from "@/modules/contracts/components/contracts-nav";

export const metadata: Metadata = {
  title: "Contracts",
};

export default function ContractsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Contracts & Customer Activation</h1>
        <p className="text-muted-foreground text-sm">
          Contract builder, legal clauses, signatures, activation, and renewals.
        </p>
      </div>
      <ContractsNav />
      {children}
    </div>
  );
}
