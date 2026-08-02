"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingAgentNav } from "@/modules/ai-marketing-agent-management/components/marketing-agent-nav";
import type { MarketingInsightRecord } from "@/modules/ai-marketing-agent-management/types/ai-marketing-agent-types";

interface MarketingRecommendationsPanelProps {
  recommendations: { items: MarketingInsightRecord[]; total: number };
}

export function MarketingRecommendationsPanel({
  recommendations,
}: MarketingRecommendationsPanelProps) {
  return (
    <div className="space-y-8">
      <MarketingAgentNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Promotion suggestions ({recommendations.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No promotion suggestions yet.</p>
          ) : (
            <ul className="space-y-4">
              {recommendations.items.map((item) => (
                <li key={item.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      {item.description ? (
                        <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
                      ) : null}
                      {item.recommendation ? (
                        <p className="mt-2 text-sm">{item.recommendation}</p>
                      ) : null}
                    </div>
                    <Badge variant="secondary">{item.priority}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
