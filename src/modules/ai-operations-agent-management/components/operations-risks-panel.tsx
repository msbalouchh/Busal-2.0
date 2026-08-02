"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsAgentNav } from "@/modules/ai-operations-agent-management/components/operations-agent-nav";
import type { OperationalRiskAlert } from "@/services/ai-operations-risk-detection.service";

interface OperationsRisksPanelProps {
  risks: OperationalRiskAlert[];
}

export function OperationsRisksPanel({ risks }: OperationsRisksPanelProps) {
  return (
    <div className="space-y-8">
      <OperationsAgentNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operational risk center ({risks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {risks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No operational risks detected.</p>
          ) : (
            <ul className="space-y-4">
              {risks.map((risk) => (
                <li key={risk.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{risk.title}</p>
                      <p className="text-muted-foreground mt-1 text-sm">{risk.description}</p>
                      <p className="mt-2 text-sm">{risk.recommendation}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{risk.category}</Badge>
                      <Badge variant="secondary">{risk.severity}</Badge>
                    </div>
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
