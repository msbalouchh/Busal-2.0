"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dismissSupportInsightAction } from "@/modules/ai-support-agent-management/actions/ai-support-agent-actions";
import { SupportAgentNav } from "@/modules/ai-support-agent-management/components/support-agent-nav";
import type { AiSupportAgentContext } from "@/modules/ai-support-agent-management/lib/get-ai-support-agent-context";
import type { SupportInsightRecord } from "@/modules/ai-support-agent-management/types/ai-support-agent-types";

interface SupportInsightsPanelProps {
  context: AiSupportAgentContext;
  insights: { items: SupportInsightRecord[]; total: number };
}

export function SupportInsightsPanel({ context, insights }: SupportInsightsPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <SupportAgentNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ticket insights ({insights.total})</CardTitle>
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
                      {insight.description ? (
                        <p className="text-muted-foreground mt-1 text-sm">{insight.description}</p>
                      ) : null}
                      {insight.recommendation ? (
                        <p className="mt-2 text-sm">{insight.recommendation}</p>
                      ) : null}
                    </div>
                    <Badge variant="secondary">{insight.priority}</Badge>
                  </div>
                  {context.permissionsFlags.canManage && insight.status === "ACTIVE" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await dismissSupportInsightAction(insight.id);
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
