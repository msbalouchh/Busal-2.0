import type { Metadata } from "next";

import { ImplementationNav } from "@/modules/implementation/components/implementation-nav";

export const metadata: Metadata = {
  title: "Implementation",
};

export default function ImplementationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Customer Implementation & Project Delivery
        </h1>
        <p className="text-muted-foreground text-sm">
          Implementation projects, templates, milestones, go-live, and hypercare.
        </p>
      </div>
      <ImplementationNav />
      {children}
    </div>
  );
}
