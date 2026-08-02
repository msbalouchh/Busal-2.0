"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Clock, Headphones, Heart, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportAgentNav } from "@/modules/ai-support-agent-management/components/support-agent-nav";
import { AI_SUPPORT_AGENT_ROUTES } from "@/modules/ai-support-agent-management/constants/routes";
import { runSupportAnalysisAction } from "@/modules/ai-support-agent-management/actions/ai-support-agent-actions";
import type { AiSupportAgentContext } from "@/modules/ai-support-agent-management/lib/get-ai-support-agent-context";
import type { SupportAgentDashboardStats } from "@/services/ai-support-analysis.service";
import type {
  SupportInsightRecord,
  SupportRecommendationRecord,
} from "@/modules/ai-support-agent-management/types/ai-support-agent-types";
import type { SatisfactionSnapshot } from "@/services/ai-support-satisfaction.service";
import type { TicketAnalysisSnapshot } from "@/services/ai-support-ticket-analysis.service";

interface SupportAgentDashboardPanelProps {
  context: AiSupportAgentContext;
  stats: SupportAgentDashboardStats;
  insights: { items: SupportInsightRecord[] };
  recommendations: { items: SupportRecommendationRecord[] };
  tickets: TicketAnalysisSnapshot;
  satisfaction: SatisfactionSnapshot;
}

export function SupportAgentDashboardPanel({
  context,
  stats,
  insights,
  recommendations,
  tickets,
  satisfaction,
}: SupportAgentDashboardPanelProps) {
  const [isPending, startTransition] = useTransition();

  const cards = [
    {
      label: "Support health",
      value: `${stats.healthScore}%`,
      sub: stats.healthLabel,
      icon: Heart,
    },
    {
      label: "Open tickets",
      value: stats.openTickets,
      sub: `${stats.waitingStaff} waiting`,
      icon: MessageSquare,
    },
    {
      label: "Satisfaction",
      value: `${stats.satisfactionScore}`,
      sub: satisfaction.satisfactionLabel,
      icon: Headphones,
    },
    {
      label: "Avg response",
      value: `${stats.avgResponseTimeHours}h`,
      sub: `${tickets.urgentCount} urgent`,
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-8">
      <SupportAgentNav />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Customer support intelligence for {context.business.businessName ?? "your business"}.
        </p>
        {context.permissionsFlags.canExecute ? (
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await runSupportAnalysisAction();
              })
            }
          >
            {isPending ? "Analyzing…" : "Run support analysis"}
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
              href={AI_SUPPORT_AGENT_ROUTES.insights()}
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
            <CardTitle className="text-base">Suggested responses</CardTitle>
            <Link
              href={AI_SUPPORT_AGENT_ROUTES.recommendations()}
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
    </div>
  );
}
