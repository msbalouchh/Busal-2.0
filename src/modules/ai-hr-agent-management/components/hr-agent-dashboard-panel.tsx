"use client";

import Link from "next/link";
import { useTransition } from "react";
import { AlertTriangle, Heart, Users, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HrAgentNav } from "@/modules/ai-hr-agent-management/components/hr-agent-nav";
import { AI_HR_AGENT_ROUTES } from "@/modules/ai-hr-agent-management/constants/routes";
import { runHrAnalysisAction } from "@/modules/ai-hr-agent-management/actions/ai-hr-agent-actions";
import type { AiHrAgentContext } from "@/modules/ai-hr-agent-management/lib/get-ai-hr-agent-context";
import type {
  HrInsightRecord,
  HrRecommendationRecord,
} from "@/modules/ai-hr-agent-management/types/ai-hr-agent-types";
import type { HrAgentDashboardStats } from "@/services/ai-hr-analysis.service";
import type { AttendanceSnapshot } from "@/services/ai-hr-attendance-analysis.service";
import type { PerformanceSnapshot } from "@/services/ai-hr-performance-analysis.service";
import type { RetentionRiskEmployee } from "@/services/ai-hr-retention-risk.service";

interface HrAgentDashboardPanelProps {
  context: AiHrAgentContext;
  stats: HrAgentDashboardStats;
  insights: { items: HrInsightRecord[] };
  recommendations: { items: HrRecommendationRecord[] };
  performance: PerformanceSnapshot;
  attendance: AttendanceSnapshot;
  atRisk: RetentionRiskEmployee[];
}

export function HrAgentDashboardPanel({
  context,
  stats,
  insights,
  recommendations,
  performance,
  attendance,
  atRisk,
}: HrAgentDashboardPanelProps) {
  const [isPending, startTransition] = useTransition();

  const cards = [
    {
      label: "HR health",
      value: `${stats.healthScore}%`,
      sub: stats.healthLabel,
      icon: Heart,
    },
    {
      label: "Active staff",
      value: stats.totalActiveStaff,
      sub: `${stats.onLeave} on leave`,
      icon: Users,
    },
    {
      label: "Engagement",
      value: `${stats.engagementRate}%`,
      sub: `${attendance.inactiveLogin} inactive logins`,
      icon: UserPlus,
    },
    {
      label: "Retention risk",
      value: stats.atRiskCount,
      sub: `${stats.pendingInvitations} pending invites`,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-8">
      <HrAgentNav />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Workforce intelligence for {context.business.businessName ?? "your business"}.
        </p>
        {context.permissionsFlags.canExecute ? (
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await runHrAnalysisAction();
              })
            }
          >
            {isPending ? "Analyzing…" : "Run HR analysis"}
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
              href={AI_HR_AGENT_ROUTES.insights()}
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
              href={AI_HR_AGENT_ROUTES.recommendations()}
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

      {atRisk.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Retention alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {atRisk.slice(0, 3).map((employee) => (
                <li key={employee.staffId} className="text-sm">
                  <span className="font-medium">{employee.name}</span>
                  <span className="text-muted-foreground"> — {employee.riskLevel} risk</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {performance.topPerformers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top performers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {performance.topPerformers.slice(0, 3).map((performer) => (
                <li key={performer.staffId} className="text-sm">
                  {performer.name} — {performer.ordersHandled} orders
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
