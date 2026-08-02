"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dismissHrInsightAction } from "@/modules/ai-hr-agent-management/actions/ai-hr-agent-actions";
import { HrAgentNav } from "@/modules/ai-hr-agent-management/components/hr-agent-nav";
import type { AiHrAgentContext } from "@/modules/ai-hr-agent-management/lib/get-ai-hr-agent-context";
import type { HrInsightRecord } from "@/modules/ai-hr-agent-management/types/ai-hr-agent-types";

interface HrInsightsPanelProps {
  context: AiHrAgentContext;
  insights: { items: HrInsightRecord[]; total: number };
}

export function HrInsightsPanel({ context, insights }: HrInsightsPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <HrAgentNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employee insights ({insights.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {insights.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No insights yet.</p>
          ) : (
            <ul className="space-y-4">
              {insights.items.map((insight) => (
                <li key={insight.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{insight.title}</p>
                      {insight.staffName ? (
                        <p className="text-muted-foreground text-xs">{insight.staffName}</p>
                      ) : null}
                      {insight.description ? (
                        <p className="text-muted-foreground mt-1 text-sm">{insight.description}</p>
                      ) : null}
                      {insight.recommendation ? (
                        <p className="mt-2 text-sm">{insight.recommendation}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
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
                          await dismissHrInsightAction(insight.id);
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
