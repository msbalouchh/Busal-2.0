"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatConfidence } from "@/modules/ai-hr-agent-management/lib/ai-hr-agent-validation";
import { updateHrRecommendationStatusAction } from "@/modules/ai-hr-agent-management/actions/ai-hr-agent-actions";
import { HrAgentNav } from "@/modules/ai-hr-agent-management/components/hr-agent-nav";
import type { AiHrAgentContext } from "@/modules/ai-hr-agent-management/lib/get-ai-hr-agent-context";
import type { HrRecommendationRecord } from "@/modules/ai-hr-agent-management/types/ai-hr-agent-types";
import type { RetentionRiskEmployee } from "@/services/ai-hr-retention-risk.service";

interface HrRecommendationsPanelProps {
  context: AiHrAgentContext;
  recommendations: { items: HrRecommendationRecord[]; total: number };
  atRisk: RetentionRiskEmployee[];
}

export function HrRecommendationsPanel({
  context,
  recommendations,
  atRisk,
}: HrRecommendationsPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <HrAgentNav />

      {atRisk.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Retention alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {atRisk.slice(0, 5).map((employee) => (
                <li key={employee.staffId} className="text-sm">
                  <span className="font-medium">{employee.name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    — {employee.riskLevel} ({employee.factors.join(", ")})
                  </span>
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
                      {item.staffName ? (
                        <p className="text-muted-foreground text-xs">{item.staffName}</p>
                      ) : null}
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
                              await updateHrRecommendationStatusAction(item.id, status);
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
