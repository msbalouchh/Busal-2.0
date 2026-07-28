import type { Metadata } from "next";

import { IamNav } from "@/modules/iam/components/iam-nav";

export const metadata: Metadata = {
  title: "Identity & Access Management",
};

export default function IamLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Identity & Access Management</h1>
        <p className="text-muted-foreground text-sm">
          Centralized authentication, authorization, sessions, API keys, and security policies.
        </p>
      </div>
      <IamNav />
      {children}
    </div>
  );
}
