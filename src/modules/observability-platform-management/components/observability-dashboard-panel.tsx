"use client";

import { Activity, AlertTriangle, BarChart3, FileText, ShieldAlert, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ObservabilityPlatformNav } from "@/modules/observability-platform-management/components/observability-platform-nav";
import type { ObservabilityPlatformContext } from "@/modules/observability-platform-management/lib/get-observability-platform-context";
import type {
  MetricRecord,
  ObservabilitySummaryRecord,
  ServiceHealthRecord,
} from "@/modules/observability-platform-management/types/observability-platform-types";

interface ObservabilityDashboardPanelProps {
  context: ObservabilityPlatformContext;
  summary: ObservabilitySummaryRecord;
  serviceHealth: ServiceHealthRecord[];
  recentMetrics: MetricRecord[];
}

function statusVariant(status: string): "default" | "secondary" | "destructive" {
  if (status === "healthy") return "default";
  if (status === "degraded") return "secondary";
  return "destructive";
}

export function ObservabilityDashboardPanel({
  context,
  summary,
  serviceHealth,
  recentMetrics,
}: ObservabilityDashboardPanelProps) {
  const cards = [
    { label: "System Status", value: summary.overallStatus, icon: Activity },
    { label: "Metrics (24h)", value: summary.metrics24h, icon: BarChart3 },
    { label: "Logs (24h)", value: summary.logs24h, icon: FileText },
    { label: "Active Alerts", value: summary.activeAlerts, icon: AlertTriangle },
    { label: "Open Incidents", value: summary.openIncidents, icon: ShieldAlert },
    { label: "Traces", value: summary.traceCount, icon: Zap },
  ];

  return (
    <div className="space-y-8">
      <ObservabilityPlatformNav />
      <p className="text-muted-foreground text-sm">
        Enterprise observability for {context.business.businessName ?? "your business"} — error rate{" "}
        {summary.errorRate}%.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="text-muted-foreground h-4 w-4" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold capitalize">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service health</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {serviceHealth.slice(0, 8).map((service) => (
                <li key={service.service} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{service.service}</span>
                  <Badge variant={statusVariant(service.status)}>{service.status}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMetrics.length === 0 ? (
              <p className="text-muted-foreground text-sm">No metrics recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentMetrics.map((metric) => (
                  <li key={metric.id} className="flex items-center justify-between text-sm">
                    <span>
                      {metric.service} / {metric.metric}
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
    </div>
  );
}
