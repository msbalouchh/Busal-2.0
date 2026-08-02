"use client";

import Link from "next/link";
import { useTransition } from "react";
import { DollarSign, Lightbulb, Target, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPence } from "@/modules/ai-sales-agent-management/lib/ai-sales-agent-validation";
import { SalesAgentNav } from "@/modules/ai-sales-agent-management/components/sales-agent-nav";
import { AI_SALES_AGENT_ROUTES } from "@/modules/ai-sales-agent-management/constants/routes";
import { runSalesAnalysisAction } from "@/modules/ai-sales-agent-management/actions/ai-sales-agent-actions";
import type { AiSalesAgentContext } from "@/modules/ai-sales-agent-management/lib/get-ai-sales-agent-context";
import type { SalesAgentDashboardStats } from "@/services/ai-sales-analysis.service";
import type {
  SalesInsightRecord,
  SalesRecommendationRecord,
} from "@/modules/ai-sales-agent-management/types/ai-sales-agent-types";
import type { SalesOpportunityItem } from "@/services/ai-sales-opportunity-detection.service";
import type { RevenueInsightSnapshot } from "@/services/ai-sales-revenue-insight.service";
import type { PipelineAnalysisSnapshot } from "@/services/ai-sales-pipeline-analysis.service";

interface SalesAgentDashboardPanelProps {
  context: AiSalesAgentContext;
  stats: SalesAgentDashboardStats;
  insights: { items: SalesInsightRecord[] };
  recommendations: { items: SalesRecommendationRecord[] };
  opportunities: SalesOpportunityItem[];
  revenue: RevenueInsightSnapshot;
  pipeline: PipelineAnalysisSnapshot;
}

export function SalesAgentDashboardPanel({
  context,
  stats,
  insights,
  recommendations,
  opportunities,
  revenue,
  pipeline,
}: SalesAgentDashboardPanelProps) {
  const [isPending, startTransition] = useTransition();

  const healthCards = [
    {
      label: "Sales health",
      value: `${stats.healthScore}%`,
      sub: stats.healthLabel,
      icon: TrendingUp,
    },
    {
      label: "Today's revenue",
      value: formatPence(stats.revenueTodayPence),
      sub: `${revenue.totalOrders} orders`,
      icon: DollarSign,
    },
    {
      label: "Pipeline value",
      value: formatPence(stats.openPipelineValuePence),
      sub: `${stats.openOpportunities} opportunities`,
      icon: Target,
    },
    {
      label: "Active insights",
      value: stats.activeInsights,
      sub: `${stats.newRecommendations} new recommendations`,
      icon: Lightbulb,
    },
  ];

  return (
    <div className="space-y-8">
      <SalesAgentNav />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          AI-powered sales analysis for {context.business.businessName ?? "your business"}.
        </p>
        {context.permissionsFlags.canExecute ? (
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await runSalesAnalysisAction();
              })
            }
          >
            {isPending ? "Analyzing…" : "Run sales analysis"}
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
              href={AI_SALES_AGENT_ROUTES.insights()}
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
            <CardTitle className="text-base">Top opportunities</CardTitle>
            <Link
              href={AI_SALES_AGENT_ROUTES.opportunities()}
              className="text-primary text-sm hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {opportunities.length === 0 ? (
              <p className="text-muted-foreground text-sm">No opportunities detected yet.</p>
            ) : (
              <ul className="space-y-3">
                {opportunities.slice(0, 5).map((item) => (
                  <li
                    key={`${item.type}-${item.id}`}
                    className="border-b pb-3 last:border-0 last:pb-0"
                  >
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
                    <p className="text-muted-foreground mt-1 text-xs capitalize">
                      {item.type} · {item.priority.toLowerCase()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {pipeline.openLeads} open leads · {pipeline.totalOpportunities} opportunities ·{" "}
            {pipeline.pendingTasks} pending tasks · {pipeline.upcomingDemos} upcoming demos
          </p>
          {recommendations.items.length > 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">
              Latest recommendation: {recommendations.items[0]?.title}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
