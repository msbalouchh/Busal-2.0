import { Bot } from "lucide-react";

import { WidgetContainer } from "@/modules/dashboard/components/widget-container";

export function AiInsightsWidget() {
  return (
    <WidgetContainer
      id="ai-insights"
      title="AI Insights"
      description="Placeholder for future AI-generated operational insights."
    >
      <div className="flex items-start gap-3">
        <Bot className="text-primary h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-muted-foreground text-sm">
          AI insights will summarize trends, anomalies, and recommended actions once connected to
          reporting and automation modules.
        </p>
      </div>
    </WidgetContainer>
  );
}
