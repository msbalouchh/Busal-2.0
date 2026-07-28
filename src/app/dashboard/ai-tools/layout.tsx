import type { Metadata } from "next";

import { AiToolsNav } from "@/modules/ai-tools/components/ai-tools-nav";

export const metadata: Metadata = {
  title: "Busal AI Tools",
};

export default function AiToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Busal AI</h1>
        <p className="text-muted-foreground text-sm">
          Tool registry, execution engine, discovery, and safety controls for AI agents.
        </p>
      </div>
      <AiToolsNav />
      {children}
    </div>
  );
}
