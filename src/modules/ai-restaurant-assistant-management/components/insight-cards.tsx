"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  BusinessHealthSummary,
  InsightCard,
  PeriodSummary,
} from "@/modules/ai-restaurant-assistant-management/types/ai-restaurant-assistant-types";

interface BusinessHealthCardProps {
  health: BusinessHealthSummary;
}

export function BusinessHealthCard({ health }: BusinessHealthCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <p className="text-4xl font-semibold">{health.score}</p>
          <p className="text-muted-foreground pb-1 text-sm">{health.label}</p>
        </div>
        {health.concerns.length > 0 ? (
          <ul className="text-sm text-amber-700 dark:text-amber-300">
            {health.concerns.map((concern) => (
              <li key={concern}>• {concern}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No critical concerns detected.</p>
        )}
      </CardContent>
    </Card>
  );
}

interface InsightCardsGridProps {
  insights: InsightCard[];
  title?: string;
}

export function InsightCardsGrid({ insights, title }: InsightCardsGridProps) {
  if (insights.length === 0) return null;

  return (
    <section className="space-y-3">
      {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {insights.map((insight) => (
          <Card key={insight.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {insight.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{insight.value}</p>
              {insight.hint ? (
                <p className="text-muted-foreground mt-1 text-xs">{insight.hint}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

interface PeriodSummaryCardsProps {
  summaries: PeriodSummary[];
}

export function PeriodSummaryCards({ summaries }: PeriodSummaryCardsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {summaries.map((summary) => (
        <Card key={summary.period}>
          <CardHeader>
            <CardTitle className="text-base">{summary.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground line-clamp-6 text-sm whitespace-pre-wrap">
              {summary.content.replace(/[#*_]/g, "")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
