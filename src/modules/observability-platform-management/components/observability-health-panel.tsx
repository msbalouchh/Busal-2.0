"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ObservabilityPlatformNav } from "@/modules/observability-platform-management/components/observability-platform-nav";
import type { ServiceHealthRecord } from "@/modules/observability-platform-management/types/observability-platform-types";

interface ObservabilityHealthPanelProps {
  systemHealth: {
    overallStatus: string;
    errorRate: number;
    totalLogs1h: number;
    errorLogs1h: number;
    metrics1h: number;
  };
  serviceHealth: ServiceHealthRecord[];
}

function statusVariant(status: string): "default" | "secondary" | "destructive" {
  if (status === "healthy") return "default";
  if (status === "degraded") return "secondary";
  return "destructive";
}

export function ObservabilityHealthPanel({
  systemHealth,
  serviceHealth,
}: ObservabilityHealthPanelProps) {
  return (
    <div className="space-y-8">
      <ObservabilityPlatformNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Overall status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={statusVariant(systemHealth.overallStatus)} className="capitalize">
              {systemHealth.overallStatus}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Error rate (1h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{systemHealth.errorRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Logs (1h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{systemHealth.totalLogs1h}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Metrics (1h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{systemHealth.metrics1h}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service health</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {serviceHealth.map((service) => (
              <li key={service.service} className="flex items-center justify-between text-sm">
                <span className="font-medium">{service.service}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{service.errorRate}% errors</span>
                  <Badge variant={statusVariant(service.status)}>{service.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
