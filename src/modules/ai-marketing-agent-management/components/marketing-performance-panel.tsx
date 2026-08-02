"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatPence,
  formatPercent,
} from "@/modules/ai-marketing-agent-management/lib/ai-marketing-agent-validation";
import { MarketingAgentNav } from "@/modules/ai-marketing-agent-management/components/marketing-agent-nav";
import type { CampaignAnalysisSnapshot } from "@/services/ai-marketing-campaign-analysis.service";
import type { MarketingTrendSnapshot } from "@/services/ai-marketing-trend-analysis.service";
import type { RetentionSnapshot } from "@/services/ai-marketing-retention-analysis.service";
import type { EngagementSnapshot } from "@/services/ai-marketing-engagement-analysis.service";

interface MarketingPerformancePanelProps {
  campaigns: CampaignAnalysisSnapshot;
  trends: MarketingTrendSnapshot;
  retention: RetentionSnapshot;
  engagement: EngagementSnapshot;
}

export function MarketingPerformancePanel({
  campaigns,
  trends,
  retention,
  engagement,
}: MarketingPerformancePanelProps) {
  const maxTrend = Math.max(...trends.trends.map((t) => t.value), 1);

  return (
    <div className="space-y-8">
      <MarketingAgentNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Month revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPence(trends.revenueMonthPence)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatPercent(retention.retentionRatePercent)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatPercent(engagement.engagementRatePercent)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{campaigns.activeCampaigns}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance trends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trends.trends.map((point) => (
              <div key={point.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{point.label}</span>
                  <span>{point.metric === "revenue" ? formatPence(point.value) : point.value}</span>
                </div>
                <div className="bg-muted h-2 rounded-full">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${Math.round((point.value / maxTrend) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campaign performance</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.campaigns.length === 0 ? (
              <p className="text-muted-foreground text-sm">No campaigns yet.</p>
            ) : (
              <ul className="space-y-3">
                {campaigns.campaigns.map((campaign) => (
                  <li key={campaign.id} className="rounded-lg border p-3">
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-muted-foreground mt-1 text-sm capitalize">
                      {campaign.type} · {campaign.status.toLowerCase()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
