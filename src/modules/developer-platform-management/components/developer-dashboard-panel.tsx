"use client";

import Link from "next/link";
import { AppWindow, Key, Webhook, Activity } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeveloperPlatformNav } from "@/modules/developer-platform-management/components/developer-platform-nav";
import { DEVELOPER_PLATFORM_ROUTES } from "@/modules/developer-platform-management/constants/routes";
import type { DeveloperPlatformContext } from "@/modules/developer-platform-management/lib/get-developer-platform-context";
import type {
  ApiApplicationRecord,
  DeveloperSummaryRecord,
} from "@/modules/developer-platform-management/types/developer-platform-types";

interface DeveloperDashboardPanelProps {
  context: DeveloperPlatformContext;
  summary: DeveloperSummaryRecord;
  applications: ApiApplicationRecord[];
}

export function DeveloperDashboardPanel({
  context,
  summary,
  applications,
}: DeveloperDashboardPanelProps) {
  const cards = [
    { label: "Applications", value: summary.applications, icon: AppWindow },
    { label: "Active Keys", value: summary.activeKeys, icon: Key },
    { label: "Webhooks", value: summary.webhooks, icon: Webhook },
    { label: "Requests (24h)", value: summary.requests24h, icon: Activity },
  ];

  return (
    <div className="space-y-8">
      <DeveloperPlatformNav />
      <p className="text-muted-foreground text-sm">
        Developer platform for {context.business.businessName ?? "your business"}.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="text-muted-foreground h-4 w-4" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">API applications</CardTitle>
          <Link
            href={DEVELOPER_PLATFORM_ROUTES.applications()}
            className="text-primary text-sm hover:underline"
          >
            Manage
          </Link>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-muted-foreground text-sm">No applications yet.</p>
          ) : (
            <ul className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <li key={app.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{app.name}</span>
                  <Badge variant="secondary">{app.apiVersion}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
