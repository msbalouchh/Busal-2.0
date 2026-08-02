import type { Metadata } from "next";

import { AiAnalyticsPanel } from "@/modules/ai-platform/components/ai-analytics-panel";
import { getAiPlatformAnalyticsContext } from "@/modules/ai-platform/lib/get-ai-platform-context";

export const metadata: Metadata = {
  title: "AI Analytics",
};

export default async function AiPlatformAnalyticsPage() {
  const { permissions, analytics, widgets } = await getAiPlatformAnalyticsContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Token usage, model usage, cost overview, response times, and success rates.
        </p>
      </div>
      <AiAnalyticsPanel permissions={permissions} analytics={analytics} widgets={widgets} />
    </div>
  );
}
