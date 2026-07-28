import type { Metadata } from "next";

import { AiAutomationNav } from "@/modules/ai-automation/components/ai-automation-nav";

export const metadata: Metadata = {
  title: "AI Automation",
};

export default function AiAutomationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">AI Automation</h1>
        <p className="text-muted-foreground text-sm">
          Event-driven workflows with AI decisions, approvals, actions, and monitoring.
        </p>
      </div>
      <AiAutomationNav />
      {children}
    </div>
  );
}
