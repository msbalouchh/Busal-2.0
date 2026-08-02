"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatConfidence } from "@/modules/ai-support-agent-management/lib/ai-support-agent-validation";
import { updateSupportRecommendationStatusAction } from "@/modules/ai-support-agent-management/actions/ai-support-agent-actions";
import { SupportAgentNav } from "@/modules/ai-support-agent-management/components/support-agent-nav";
import type { AiSupportAgentContext } from "@/modules/ai-support-agent-management/lib/get-ai-support-agent-context";
import type { SupportRecommendationRecord } from "@/modules/ai-support-agent-management/types/ai-support-agent-types";

interface SupportRecommendationsPanelProps {
  context: AiSupportAgentContext;
  recommendations: { items: SupportRecommendationRecord[]; total: number };
}

export function SupportRecommendationsPanel({
  context,
  recommendations,
}: SupportRecommendationsPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <SupportAgentNav />
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
                              await updateSupportRecommendationStatusAction(item.id, status);
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
