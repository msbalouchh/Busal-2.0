"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dismissSalesInsightAction } from "@/modules/ai-sales-agent-management/actions/ai-sales-agent-actions";
import { SalesAgentNav } from "@/modules/ai-sales-agent-management/components/sales-agent-nav";
import type { AiSalesAgentContext } from "@/modules/ai-sales-agent-management/lib/get-ai-sales-agent-context";
import type { SalesInsightRecord } from "@/modules/ai-sales-agent-management/types/ai-sales-agent-types";

interface SalesInsightsPanelProps {
  context: AiSalesAgentContext;
  insights: { items: SalesInsightRecord[]; total: number };
}

export function SalesInsightsPanel({ context, insights }: SalesInsightsPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <SalesAgentNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales insights ({insights.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {insights.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No insights yet. Run sales analysis from the dashboard.
            </p>
          ) : (
            <ul className="space-y-4">
              {insights.items.map((insight) => (
                <li key={insight.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{insight.title}</p>
                      {insight.description ? (
                        <p className="text-muted-foreground mt-1 text-sm">{insight.description}</p>
                      ) : null}
                      {insight.recommendation ? (
                        <p className="mt-2 text-sm">{insight.recommendation}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{insight.category}</Badge>
                      <Badge variant="secondary">{insight.priority}</Badge>
                    </div>
                  </div>
                  {context.permissionsFlags.canManage && insight.status === "ACTIVE" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await dismissSalesInsightAction(insight.id);
                        })
                      }
                    >
                      Dismiss
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
