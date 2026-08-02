"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatConfidence } from "@/modules/ai-finance-agent-management/lib/ai-finance-agent-validation";
import { updateFinanceRecommendationStatusAction } from "@/modules/ai-finance-agent-management/actions/ai-finance-agent-actions";
import { FinanceAgentNav } from "@/modules/ai-finance-agent-management/components/finance-agent-nav";
import type { AiFinanceAgentContext } from "@/modules/ai-finance-agent-management/lib/get-ai-finance-agent-context";
import type { FinanceRecommendationRecord } from "@/modules/ai-finance-agent-management/types/ai-finance-agent-types";
import type { FinancialRiskAlert } from "@/services/ai-finance-risk.service";

interface FinanceRecommendationsPanelProps {
  context: AiFinanceAgentContext;
  recommendations: { items: FinanceRecommendationRecord[]; total: number };
  risks: FinancialRiskAlert[];
}

export function FinanceRecommendationsPanel({
  context,
  recommendations,
  risks,
}: FinanceRecommendationsPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <FinanceAgentNav />

      {risks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {risks.slice(0, 5).map((risk) => (
                <li key={risk.id} className="text-sm">
                  <span className="font-medium">{risk.title}</span>
                  <span className="text-muted-foreground"> — {risk.severity}</span>
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
                              await updateFinanceRecommendationStatusAction(item.id, status);
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
