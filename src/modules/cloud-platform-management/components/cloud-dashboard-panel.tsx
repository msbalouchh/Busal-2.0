"use client";

import { Cloud, CreditCard, Flag, Gauge, Key, Server } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudPlatformNav } from "@/modules/cloud-platform-management/components/cloud-platform-nav";
import type { CloudPlatformContext } from "@/modules/cloud-platform-management/lib/get-cloud-platform-context";
import type {
  CloudSummaryRecord,
  UsageMetricRecord,
} from "@/modules/cloud-platform-management/types/cloud-platform-types";

interface CloudDashboardPanelProps {
  context: CloudPlatformContext;
  summary: CloudSummaryRecord;
  usage: UsageMetricRecord[];
}

export function CloudDashboardPanel({ context, summary, usage }: CloudDashboardPanelProps) {
  const cards = [
    { label: "Tenant", value: summary.tenantKey, icon: Server },
    { label: "Status", value: summary.tenantStatus, icon: Cloud },
    { label: "Plan", value: summary.planName ?? "—", icon: CreditCard },
    { label: "Feature Flags", value: `${summary.enabledFlags}/${summary.totalFlags}`, icon: Flag },
    { label: "Region", value: summary.region ?? "—", icon: Gauge },
    { label: "License", value: summary.licenseValid ? "Valid" : "Invalid", icon: Key },
  ];

  return (
    <div className="space-y-8">
      <CloudPlatformNav />
      <p className="text-muted-foreground text-sm">
        Cloud & SaaS operations for {context.business.businessName ?? "your business"}.
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          {usage.length === 0 ? (
            <p className="text-muted-foreground text-sm">No usage recorded.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {usage.slice(0, 6).map((m) => (
                <li key={m.resource} className="flex justify-between">
                  <span>{m.resource}</span>
                  <span>
                    {m.value}/{m.limit > 0 ? m.limit : "∞"}{" "}
                    <Badge variant="outline">{m.utilization}%</Badge>
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
