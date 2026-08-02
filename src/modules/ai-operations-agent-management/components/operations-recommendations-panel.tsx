"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatConfidence } from "@/modules/ai-operations-agent-management/lib/ai-operations-agent-validation";
import { updateOperationRecommendationStatusAction } from "@/modules/ai-operations-agent-management/actions/ai-operations-agent-actions";
import { OperationsAgentNav } from "@/modules/ai-operations-agent-management/components/operations-agent-nav";
import type { AiOperationsAgentContext } from "@/modules/ai-operations-agent-management/lib/get-ai-operations-agent-context";
import type { OperationRecommendationRecord } from "@/modules/ai-operations-agent-management/types/ai-operations-agent-types";
import type { BottleneckAlert } from "@/services/ai-operations-bottleneck-detection.service";

interface OperationsRecommendationsPanelProps {
  context: AiOperationsAgentContext;
  recommendations: { items: OperationRecommendationRecord[]; total: number };
  bottlenecks: BottleneckAlert[];
}

export function OperationsRecommendationsPanel({
  context,
  recommendations,
  bottlenecks,
}: OperationsRecommendationsPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <OperationsAgentNav />

      {bottlenecks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related bottlenecks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {bottlenecks.slice(0, 5).map((alert) => (
                <li key={alert.id} className="text-sm">
                  <span className="font-medium">{alert.area}</span>
                  <span className="text-muted-foreground"> — {alert.severity}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recommendations ({recommendations.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recommendations yet.</p>
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
                      <p className="mt-2 text-sm">{item.action}</p>
                      {item.expectedImpact ? (
                        <p className="text-muted-foreground mt-1 text-xs">
                          Expected impact: {item.expectedImpact}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{formatConfidence(item.confidenceScore)}</Badge>
                      <Badge variant="secondary">{item.status}</Badge>
                    </div>
                  </div>
                  {context.permissionsFlags.canManage && item.status === "NEW" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(["VIEWED", "IMPLEMENTED", "DISMISSED"] as const).map((status) => (
                        <Button
                          key={status}
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() =>
                            startTransition(async () => {
                              await updateOperationRecommendationStatusAction(item.id, status);
                            })
                          }
                        >
                          {status.charAt(0) + status.slice(1).toLowerCase()}
                        </Button>
                      ))}
                    </div>
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
