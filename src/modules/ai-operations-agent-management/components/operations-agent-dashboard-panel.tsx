"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Activity, AlertTriangle, Gauge, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsAgentNav } from "@/modules/ai-operations-agent-management/components/operations-agent-nav";
import { AI_OPERATIONS_AGENT_ROUTES } from "@/modules/ai-operations-agent-management/constants/routes";
import { runOperationsAnalysisAction } from "@/modules/ai-operations-agent-management/actions/ai-operations-agent-actions";
import type { AiOperationsAgentContext } from "@/modules/ai-operations-agent-management/lib/get-ai-operations-agent-context";
import type {
  OperationInsightRecord,
  OperationRecommendationRecord,
} from "@/modules/ai-operations-agent-management/types/ai-operations-agent-types";
import type { BottleneckAlert } from "@/services/ai-operations-bottleneck-detection.service";
import type { OperationalHealthSnapshot } from "@/services/ai-operations-operational-health.service";
import type { OperationalRiskAlert } from "@/services/ai-operations-risk-detection.service";
import type { OperationsAgentDashboardStats } from "@/services/ai-operations-analysis.service";
import type { OperationalTrendSnapshot } from "@/services/ai-operations-trend-analysis.service";

interface OperationsAgentDashboardPanelProps {
  context: AiOperationsAgentContext;
  stats: OperationsAgentDashboardStats;
  insights: { items: OperationInsightRecord[] };
  recommendations: { items: OperationRecommendationRecord[] };
  health: OperationalHealthSnapshot;
  bottlenecks: BottleneckAlert[];
  risks: OperationalRiskAlert[];
  trends: OperationalTrendSnapshot;
}

export function OperationsAgentDashboardPanel({
  context,
  stats,
  insights,
  recommendations,
  health,
  bottlenecks,
  risks,
  trends,
}: OperationsAgentDashboardPanelProps) {
  const [isPending, startTransition] = useTransition();

  const cards = [
    {
      label: "Operational health",
      value: `${stats.healthScore}%`,
      sub: stats.healthLabel,
      icon: Activity,
    },
    {
      label: "Resource utilization",
      value: `${stats.utilizationRate}%`,
      sub: `${stats.pendingOrders} pending orders`,
      icon: Gauge,
    },
    {
      label: "Bottlenecks",
      value: stats.bottleneckCount,
      sub: `${health.lowStockCount} low-stock items`,
      icon: Layers,
    },
    {
      label: "Risk alerts",
      value: stats.riskCount,
      sub: `${stats.newRecommendations} new recommendations`,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-8">
      <OperationsAgentNav />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Operational intelligence for {context.business.businessName ?? "your business"}.
        </p>
        {context.permissionsFlags.canExecute ? (
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await runOperationsAnalysisAction();
              })
            }
          >
            {isPending ? "Analyzing…" : "Run operations analysis"}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
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

      {trends.summary ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily operational summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{trends.summary}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent insights</CardTitle>
            <Link
              href={AI_OPERATIONS_AGENT_ROUTES.workflows()}
              className="text-primary text-sm hover:underline"
            >
              View workflows
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
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recommendations</CardTitle>
            <Link
              href={AI_OPERATIONS_AGENT_ROUTES.recommendations()}
              className="text-primary text-sm hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recommendations.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recommendations yet.</p>
            ) : (
              <ul className="space-y-3">
                {recommendations.items.map((item) => (
                  <li key={item.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{item.action}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {bottlenecks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bottleneck alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {bottlenecks.slice(0, 3).map((alert) => (
                <li key={alert.id} className="text-sm">
                  <span className="font-medium">{alert.area}</span>
                  <span className="text-muted-foreground"> — {alert.severity}</span>
                  <p className="text-muted-foreground mt-0.5">{alert.description}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {risks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operational risks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {risks.slice(0, 3).map((risk) => (
                <li key={risk.id} className="text-sm">
                  <span className="font-medium">{risk.title}</span>
                  <span className="text-muted-foreground"> — {risk.severity}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
