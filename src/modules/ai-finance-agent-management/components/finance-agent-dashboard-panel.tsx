"use client";

import Link from "next/link";
import { useTransition } from "react";
import { AlertTriangle, Heart, PoundSterling, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceAgentNav } from "@/modules/ai-finance-agent-management/components/finance-agent-nav";
import { AI_FINANCE_AGENT_ROUTES } from "@/modules/ai-finance-agent-management/constants/routes";
import { runFinanceAnalysisAction } from "@/modules/ai-finance-agent-management/actions/ai-finance-agent-actions";
import type { AiFinanceAgentContext } from "@/modules/ai-finance-agent-management/lib/get-ai-finance-agent-context";
import type {
  FinanceInsightRecord,
  FinanceRecommendationRecord,
} from "@/modules/ai-finance-agent-management/types/ai-finance-agent-types";
import type { FinanceAgentDashboardStats } from "@/services/ai-finance-analysis.service";
import type { CashFlowSnapshot } from "@/services/ai-finance-cash-flow.service";
import type { RevenueSnapshot } from "@/services/ai-finance-revenue-analysis.service";
import type { FinancialRiskAlert } from "@/services/ai-finance-risk.service";

interface FinanceAgentDashboardPanelProps {
  context: AiFinanceAgentContext;
  stats: FinanceAgentDashboardStats;
  insights: { items: FinanceInsightRecord[] };
  recommendations: { items: FinanceRecommendationRecord[] };
  revenue: RevenueSnapshot;
  cashFlow: CashFlowSnapshot;
  risks: FinancialRiskAlert[];
}

export function FinanceAgentDashboardPanel({
  context,
  stats,
  insights,
  recommendations,
  revenue,
  cashFlow,
  risks,
}: FinanceAgentDashboardPanelProps) {
  const [isPending, startTransition] = useTransition();

  const cards = [
    {
      label: "Financial health",
      value: `${stats.healthScore}%`,
      sub: stats.healthLabel,
      icon: Heart,
    },
    {
      label: "Net cash flow",
      value: `£${(stats.netCashFlowPence / 100).toFixed(0)}`,
      sub: `${stats.overdueInvoices} overdue invoices`,
      icon: PoundSterling,
    },
    {
      label: "Profit margin",
      value: `${stats.profitMarginPercent}%`,
      sub: `£${(revenue.grossRevenueMonthPence / 100).toFixed(0)} monthly revenue`,
      icon: TrendingUp,
    },
    {
      label: "Risk alerts",
      value: stats.riskCount,
      sub: `${cashFlow.openCollections} open collections`,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-8">
      <FinanceAgentNav />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Financial intelligence for {context.business.businessName ?? "your business"}.
        </p>
        {context.permissionsFlags.canExecute ? (
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await runFinanceAnalysisAction();
              })
            }
          >
            {isPending ? "Analyzing…" : "Run financial analysis"}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent insights</CardTitle>
            <Link
              href={AI_FINANCE_AGENT_ROUTES.revenue()}
              className="text-primary text-sm hover:underline"
            >
              View analytics
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
              href={AI_FINANCE_AGENT_ROUTES.recommendations()}
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

      {risks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk alerts</CardTitle>
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
