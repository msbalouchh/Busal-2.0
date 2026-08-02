"use client";

import Link from "next/link";
import { Activity, Play, Workflow, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutomationPlatformNav } from "@/modules/automation-platform-management/components/automation-platform-nav";
import { AUTOMATION_PLATFORM_ROUTES } from "@/modules/automation-platform-management/constants/routes";
import type { AutomationPlatformContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";
import type {
  AutomationLogRecord,
  AutomationWorkflowRecord,
} from "@/modules/automation-platform-management/types/automation-platform-types";

interface AutomationDashboardPanelProps {
  context: AutomationPlatformContext;
  summary: { workflows: number; executions: number; activeCount: number; failedCount: number };
  history: { total: number; completed: number; failed: number; running: number };
  workflows: AutomationWorkflowRecord[];
  logs: AutomationLogRecord[];
}

export function AutomationDashboardPanel({
  context,
  summary,
  history,
  workflows,
  logs,
}: AutomationDashboardPanelProps) {
  const cards = [
    {
      label: "Workflows",
      value: summary.workflows,
      sub: `${summary.activeCount} active`,
      icon: Workflow,
    },
    {
      label: "Executions",
      value: summary.executions,
      sub: `${history.completed} completed`,
      icon: Play,
    },
    { label: "Failed", value: summary.failedCount, sub: "Needs attention", icon: Activity },
    { label: "Running", value: history.running, sub: "In progress", icon: Zap },
  ];

  return (
    <div className="space-y-8">
      <AutomationPlatformNav />
      <p className="text-muted-foreground text-sm">
        Automation platform for {context.business.businessName ?? "your business"}.
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
              <p className="text-muted-foreground text-xs">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent workflows</CardTitle>
            <Link
              href={AUTOMATION_PLATFORM_ROUTES.workflows()}
              className="text-primary text-sm hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {workflows.length === 0 ? (
              <p className="text-muted-foreground text-sm">No workflows yet.</p>
            ) : (
              <ul className="space-y-3">
                {workflows.slice(0, 5).map((workflow) => (
                  <li key={workflow.id} className="flex items-center justify-between text-sm">
                    <Link
                      href={AUTOMATION_PLATFORM_ROUTES.workflowDetail(workflow.id)}
                      className="font-medium hover:underline"
                    >
                      {workflow.name}
                    </Link>
                    <Badge variant="secondary">{workflow.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent logs</CardTitle>
            <Link
              href={AUTOMATION_PLATFORM_ROUTES.logs()}
              className="text-primary text-sm hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No logs yet.</p>
            ) : (
              <ul className="space-y-2">
                {logs.slice(0, 5).map((log) => (
                  <li key={log.id} className="text-sm">
                    <span className="font-medium">{log.level}</span>
                    <span className="text-muted-foreground"> — {log.message}</span>
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
