"use client";

import { BarChart3, Brain, Sparkles, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemoryNav } from "@/modules/ai-memory-management/components/memory-nav";
import type { AiMemoryContext } from "@/modules/ai-memory-management/lib/get-ai-memory-context";
import type {
  MemoryAnalyticsSnapshot,
  MemoryDashboardStats,
  MemoryTimelineEntry,
} from "@/modules/ai-memory-management/types/ai-memory-types";

interface MemoryAnalyticsPanelProps {
  context: AiMemoryContext;
  analytics: MemoryAnalyticsSnapshot & {
    stats: MemoryDashboardStats;
    timeline: MemoryTimelineEntry[];
  };
}

export function MemoryAnalyticsPanel({ analytics }: MemoryAnalyticsPanelProps) {
  const cards = [
    {
      label: "Average importance",
      value: analytics.averageImportance.toFixed(2),
      icon: TrendingUp,
    },
    { label: "Recent growth", value: analytics.recentGrowth, icon: BarChart3 },
    { label: "Semantic memories", value: analytics.stats.semanticMemories, icon: Sparkles },
    { label: "Archived", value: analytics.stats.archivedMemories, icon: Brain },
  ];

  return (
    <div className="space-y-8">
      <MemoryNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="text-muted-foreground h-4 w-4" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Memories by type</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(analytics.byType).length === 0 ? (
              <p className="text-muted-foreground text-sm">No analytics data yet.</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(analytics.byType).map(([type, count]) => (
                  <li key={type} className="flex items-center justify-between text-sm">
                    <span>{type}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Memories by agent</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.byAgent.length === 0 ? (
              <p className="text-muted-foreground text-sm">No agent-scoped memories yet.</p>
            ) : (
              <ul className="space-y-2">
                {analytics.byAgent.map((entry) => (
                  <li key={entry.agentId} className="flex items-center justify-between text-sm">
                    <span className="truncate">{entry.agentId}</span>
                    <span className="font-medium">{entry.count}</span>
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
