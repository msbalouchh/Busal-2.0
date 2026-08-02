"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSalesRecommendationStatusAction } from "@/modules/ai-sales-agent-management/actions/ai-sales-agent-actions";
import { SalesAgentNav } from "@/modules/ai-sales-agent-management/components/sales-agent-nav";
import type { AiSalesAgentContext } from "@/modules/ai-sales-agent-management/lib/get-ai-sales-agent-context";
import type { SalesRecommendationRecord } from "@/modules/ai-sales-agent-management/types/ai-sales-agent-types";

interface SalesRecommendationsPanelProps {
  context: AiSalesAgentContext;
  recommendations: { items: SalesRecommendationRecord[]; total: number };
}

export function SalesRecommendationsPanel({
  context,
  recommendations,
}: SalesRecommendationsPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <SalesAgentNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Sales recommendations ({recommendations.total})
          </CardTitle>
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
                      <p className="mt-2 text-sm">
                        <span className="font-medium">Action:</span> {item.action}
                      </p>
                      {item.expectedImpact ? (
                        <p className="text-muted-foreground mt-1 text-sm">
                          Expected impact: {item.expectedImpact}
                        </p>
                      ) : null}
                      {item.customerName ? (
                        <p className="text-muted-foreground mt-1 text-sm">
                          Customer: {item.customerName}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{item.priority}</Badge>
                      <Badge variant="outline">{item.status}</Badge>
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
                              await updateSalesRecommendationStatusAction(item.id, status);
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
