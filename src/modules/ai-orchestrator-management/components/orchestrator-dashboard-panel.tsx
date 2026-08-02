"use client";

import Link from "next/link";
import { GitBranch, Workflow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrchestratorNav } from "@/modules/ai-orchestrator-management/components/orchestrator-nav";
import { AI_ORCHESTRATOR_ROUTES } from "@/modules/ai-orchestrator-management/constants/routes";
import type { AiOrchestratorContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";
import type {
  WorkflowDashboardStats,
  WorkflowListResult,
  WorkflowTemplate,
} from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";

interface OrchestratorDashboardPanelProps {
  context: AiOrchestratorContext;
  stats: WorkflowDashboardStats;
  recent: WorkflowListResult;
  monitor: { health: string; running: number; failed: number };
  templates: WorkflowTemplate[];
}

export function OrchestratorDashboardPanel({
  stats,
  recent,
  monitor,
  templates,
}: OrchestratorDashboardPanelProps) {
  const statCards = [
    { label: "Total workflows", value: stats.totalWorkflows, icon: Workflow },
    { label: "Active", value: stats.activeWorkflows, icon: GitBranch },
    { label: "Executions", value: stats.totalExecutions, icon: Workflow },
    { label: "Running", value: stats.runningExecutions, icon: GitBranch },
    { label: "Failed", value: stats.failedExecutions, icon: Workflow },
    { label: "Draft", value: stats.draftWorkflows, icon: GitBranch },
  ];

  return (
    <div className="space-y-8">
      <OrchestratorNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orchestrator health</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm capitalize">
            Status: <span className="font-medium">{monitor.health}</span> · Running:{" "}
            {monitor.running} · Failed: {monitor.failed}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent workflows</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">No workflows created yet.</p>
            ) : (
              <ul className="space-y-3">
                {recent.items.map((workflow) => (
                  <li key={workflow.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <Link
                      href={AI_ORCHESTRATOR_ROUTES.workflow(workflow.id)}
                      className="hover:text-primary font-medium transition-colors"
                    >
                      {workflow.name}
                    </Link>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {workflow.status} · {workflow.stepCount} steps
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflow templates</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {templates.map((template) => (
                <li key={template.key} className="border-b pb-3 last:border-0 last:pb-0">
                  <p className="font-medium">{template.name}</p>
                  <p className="text-muted-foreground mt-1 text-sm">{template.description}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {template.steps.length} steps
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
