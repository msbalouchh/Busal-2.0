"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommunicationPlatformNav } from "@/modules/communication-platform-management/components/communication-platform-nav";
import type { CommunicationAnalyticsRecord } from "@/modules/communication-platform-management/types/communication-platform-types";

interface CommunicationAnalyticsPanelProps {
  analytics: CommunicationAnalyticsRecord;
}

export function CommunicationAnalyticsPanel({ analytics }: CommunicationAnalyticsPanelProps) {
  const metrics = [
    { label: "Total messages", value: analytics.totalMessages },
    { label: "Delivered", value: analytics.delivered },
    { label: "Failed", value: analytics.failed },
    { label: "Queued", value: analytics.queued },
    { label: "Delivery rate", value: `${analytics.deliveryRate}%` },
    { label: "Campaigns", value: analytics.campaigns },
  ];

  return (
    <div className="space-y-8">
      <CommunicationPlatformNav />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
