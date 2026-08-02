"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsAgentNav } from "@/modules/ai-operations-agent-management/components/operations-agent-nav";
import type { BottleneckAlert } from "@/services/ai-operations-bottleneck-detection.service";
import type { OperationalTrendSnapshot } from "@/services/ai-operations-trend-analysis.service";

interface OperationsEfficiencyPanelProps {
  trends: OperationalTrendSnapshot;
  bottlenecks: BottleneckAlert[];
}

export function OperationsEfficiencyPanel({ trends, bottlenecks }: OperationsEfficiencyPanelProps) {
  return (
    <div className="space-y-8">
      <OperationsAgentNav />

      {trends.summary ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Efficiency summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{trends.summary}</p>
            {trends.kitchenPrepMinutes !== null ? (
              <p className="text-muted-foreground mt-2 text-sm">
                Average kitchen prep time: {trends.kitchenPrepMinutes} min
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trends.orderTrend.length === 0 ? (
              <p className="text-muted-foreground text-sm">No trend data available.</p>
            ) : (
              <ul className="space-y-2">
                {trends.orderTrend.map((point) => (
                  <li
                    key={`${point.metric}-${point.label}`}
                    className="flex justify-between text-sm"
                  >
                    <span>{point.label}</span>
                    <span className="text-muted-foreground">{point.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trends.revenueTrend.length === 0 ? (
              <p className="text-muted-foreground text-sm">No revenue trend data.</p>
            ) : (
              <ul className="space-y-2">
                {trends.revenueTrend.map((point) => (
                  <li
                    key={`${point.metric}-${point.label}`}
                    className="flex justify-between text-sm"
                  >
                    <span>{point.label}</span>
                    <span className="text-muted-foreground">{point.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
