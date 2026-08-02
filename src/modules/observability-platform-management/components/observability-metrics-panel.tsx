"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ObservabilityPlatformNav } from "@/modules/observability-platform-management/components/observability-platform-nav";
import type { MetricRecord } from "@/modules/observability-platform-management/types/observability-platform-types";

interface ObservabilityMetricsPanelProps {
  metrics: MetricRecord[];
  serviceFilter: string;
}

export function ObservabilityMetricsPanel({
  metrics,
  serviceFilter,
}: ObservabilityMetricsPanelProps) {
  return (
    <div className="space-y-8">
      <ObservabilityPlatformNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Metrics explorer{serviceFilter ? ` — ${serviceFilter}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <p className="text-muted-foreground text-sm">No metrics found.</p>
          ) : (
            <ul className="space-y-2">
              {metrics.map((metric) => (
                <li
                  key={metric.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span>
                    <Badge variant="outline" className="mr-2">
                      {metric.service}
                    </Badge>
                    {metric.metric}
                  </span>
                  <span className="font-medium">
                    {metric.value}
                    {metric.unit ? ` ${metric.unit}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
