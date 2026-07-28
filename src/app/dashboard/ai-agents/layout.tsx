import type { Metadata } from "next";

import { AiAgentsNav } from "@/modules/ai-agents/components/ai-agents-nav";

export const metadata: Metadata = {
  title: "AI Agents",
};

export default function AiAgentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">AI Agents</h1>
        <p className="text-muted-foreground text-sm">
          Create, deploy, and collaborate with AI agents across every Busal module.
        </p>
      </div>
      <AiAgentsNav />
      {children}
    </div>
  );
}
