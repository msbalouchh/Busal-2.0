"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsAgentNav } from "@/modules/ai-operations-agent-management/components/operations-agent-nav";
import type { BottleneckAlert } from "@/services/ai-operations-bottleneck-detection.service";
import type { OperationalHealthSnapshot } from "@/services/ai-operations-operational-health.service";
import type { OperationalRiskAlert } from "@/services/ai-operations-risk-detection.service";

interface OperationsHealthPanelProps {
  health: OperationalHealthSnapshot;
  bottlenecks: BottleneckAlert[];
  risks: OperationalRiskAlert[];
}

export function OperationsHealthPanel({ health, bottlenecks, risks }: OperationsHealthPanelProps) {
  return (
    <div className="space-y-8">
      <OperationsAgentNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Health score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{health.healthScore}%</p>
            <p className="text-muted-foreground text-xs">{health.healthLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resource utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{health.utilizationRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{health.pendingOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Capacity utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{health.capacityUtilization}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bottleneck alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {bottlenecks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No bottlenecks detected.</p>
            ) : (
              <ul className="space-y-3">
                {bottlenecks.map((alert) => (
                  <li key={alert.id} className="rounded border p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{alert.area}</p>
                      <Badge variant="outline">{alert.severity}</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">{alert.description}</p>
                    <p className="mt-1">{alert.recommendation}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operational risk alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {risks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No operational risks detected.</p>
            ) : (
              <ul className="space-y-3">
                {risks.map((risk) => (
                  <li key={risk.id} className="rounded border p-3 text-sm">
                    <p className="font-medium">
                      {risk.title} <span className="text-muted-foreground">({risk.severity})</span>
                    </p>
                    <p className="text-muted-foreground mt-1">{risk.description}</p>
                    <p className="mt-1">{risk.recommendation}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
