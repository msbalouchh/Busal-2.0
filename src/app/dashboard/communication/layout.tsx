import type { Metadata } from "next";

import { CommunicationNav } from "@/modules/communication/components/communication-nav";

export const metadata: Metadata = {
  title: "Communication Center",
};

export default function CommunicationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Communication Center</h1>
        <p className="text-muted-foreground text-sm">
          Unified omnichannel inbox with conversations, timeline, assignment, and AI assistance.
        </p>
      </div>
      <CommunicationNav />
      {children}
    </div>
  );
}
