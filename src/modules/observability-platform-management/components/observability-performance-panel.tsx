"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ObservabilityPlatformNav } from "@/modules/observability-platform-management/components/observability-platform-nav";
import type { PerformanceSummaryRecord } from "@/modules/observability-platform-management/types/observability-platform-types";

interface ObservabilityPerformancePanelProps {
  performance: PerformanceSummaryRecord;
  latencySeries: Array<{ service: string; metric: string; value: number; recordedAt: string }>;
  throughputSeries: Array<{ service: string; metric: string; value: number; recordedAt: string }>;
}

export function ObservabilityPerformancePanel({
  performance,
  latencySeries,
  throughputSeries,
}: ObservabilityPerformancePanelProps) {
  return (
    <div className="space-y-8">
      <ObservabilityPlatformNav />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg latency</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{performance.avgLatencyMs} ms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total throughput</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{performance.totalThroughput}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latency series</CardTitle>
          </CardHeader>
          <CardContent>
            {latencySeries.length === 0 ? (
              <p className="text-muted-foreground text-sm">No latency data.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {latencySeries.map((point, index) => (
                  <li key={`${point.metric}-${index}`} className="flex justify-between">
                    <span>
                      {point.service} / {point.metric}
                    </span>
                    <span className="font-medium">{point.value} ms</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Throughput series</CardTitle>
          </CardHeader>
          <CardContent>
            {throughputSeries.length === 0 ? (
              <p className="text-muted-foreground text-sm">No throughput data.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {throughputSeries.map((point, index) => (
                  <li key={`${point.metric}-${index}`} className="flex justify-between">
                    <span>
                      {point.service} / {point.metric}
                    </span>
                    <span className="font-medium">{point.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By service</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {performance.byService.map((row) => (
              <li key={row.service} className="flex justify-between">
                <span>{row.service}</span>
                <span>
                  avg {row.avgValue} · max {row.maxValue}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
