"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Heart, Megaphone, Target, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/modules/ai-marketing-agent-management/lib/ai-marketing-agent-validation";
import { MarketingAgentNav } from "@/modules/ai-marketing-agent-management/components/marketing-agent-nav";
import { AI_MARKETING_AGENT_ROUTES } from "@/modules/ai-marketing-agent-management/constants/routes";
import { runMarketingAnalysisAction } from "@/modules/ai-marketing-agent-management/actions/ai-marketing-agent-actions";
import type { AiMarketingAgentContext } from "@/modules/ai-marketing-agent-management/lib/get-ai-marketing-agent-context";
import type { MarketingAgentDashboardStats } from "@/services/ai-marketing-analysis.service";
import type { MarketingInsightRecord } from "@/modules/ai-marketing-agent-management/types/ai-marketing-agent-types";
import type { CustomerSegment } from "@/services/ai-marketing-segmentation.service";
import type { AudienceSnapshot } from "@/services/ai-marketing-audience-analysis.service";
import type { CampaignAnalysisSnapshot } from "@/services/ai-marketing-campaign-analysis.service";

interface MarketingAgentDashboardPanelProps {
  context: AiMarketingAgentContext;
  stats: MarketingAgentDashboardStats;
  insights: { items: MarketingInsightRecord[] };
  promotions: { items: MarketingInsightRecord[] };
  segments: CustomerSegment[];
  audience: AudienceSnapshot;
  campaigns: CampaignAnalysisSnapshot;
}

export function MarketingAgentDashboardPanel({
  context,
  stats,
  insights,
  promotions,
  segments,
  audience,
  campaigns,
}: MarketingAgentDashboardPanelProps) {
  const [isPending, startTransition] = useTransition();

  const healthCards = [
    {
      label: "Marketing health",
      value: `${stats.healthScore}%`,
      sub: stats.healthLabel,
      icon: Heart,
    },
    {
      label: "Retention rate",
      value: formatPercent(stats.retentionRatePercent),
      sub: `${stats.atRiskCustomers} at risk`,
      icon: Users,
    },
    {
      label: "Active campaigns",
      value: stats.activeCampaigns,
      sub: `${stats.totalCampaigns} total`,
      icon: Megaphone,
    },
    {
      label: "Engagement",
      value: formatPercent(stats.engagementRatePercent),
      sub: `${stats.activeInsights} active insights`,
      icon: Target,
    },
  ];

  return (
    <div className="space-y-8">
      <MarketingAgentNav />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Marketing intelligence for {context.business.businessName ?? "your business"}.
        </p>
        {context.permissionsFlags.canExecute ? (
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await runMarketingAnalysisAction();
              })
            }
          >
            {isPending ? "Analyzing…" : "Run marketing analysis"}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {healthCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="text-muted-foreground h-4 w-4" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{card.value}</p>
              <p className="text-muted-foreground text-xs">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent insights</CardTitle>
            <Link
              href={AI_MARKETING_AGENT_ROUTES.insights()}
              className="text-primary text-sm hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {insights.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">Run analysis to generate insights.</p>
            ) : (
              <ul className="space-y-3">
                {insights.items.map((insight) => (
                  <li key={insight.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <p className="font-medium">{insight.title}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{insight.description}</p>
                    <p className="text-muted-foreground mt-1 text-xs capitalize">
                      {insight.category} · {insight.priority.toLowerCase()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Promotion suggestions</CardTitle>
            <Link
              href={AI_MARKETING_AGENT_ROUTES.recommendations()}
              className="text-primary text-sm hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {promotions.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">No promotion suggestions yet.</p>
            ) : (
              <ul className="space-y-3">
                {promotions.items.map((item) => (
                  <li key={item.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{item.recommendation}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audience & campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {audience.totalCustomers} customers · {audience.newCustomers} new ·{" "}
            {campaigns.activeCampaigns} active campaigns · {segments.length} segments
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
